/*******************************************************************************
 * Copyright (c) 2010 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.testing.shared;

import java.lang.reflect.Field;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.eclipse.scout.commons.Assertions;
import org.eclipse.scout.commons.CollectionUtility;
import org.eclipse.scout.rt.platform.AnnotationFactory;
import org.eclipse.scout.rt.platform.Platform;
import org.eclipse.scout.rt.platform.cdi.BeanImplementor;
import org.eclipse.scout.rt.platform.cdi.IBean;
import org.eclipse.scout.rt.platform.cdi.IBeanContext;
import org.mockito.Mockito;

/**
 *
 */
public final class TestingUtility {

  private TestingUtility() {
  }

  /**
   * Wait until the condition returns a non-null result or timeout is reached.
   * <p>
   * When timeout is reached an exception is thrown.
   */
  public static <T> T waitUntil(long timeout, WaitCondition<T> w) throws Throwable {
    long ts = System.currentTimeMillis() + timeout;
    T t = w.run();
    while ((t == null) && System.currentTimeMillis() < ts) {
      Thread.sleep(40);
      t = w.run();
    }
    if (t != null) {
      return t;
    }
    else {
      throw new InterruptedException("timeout reached");
    }
  }

  /**
   * Registers the given services in the current {@link IBeanContext} and returns their registrations.<br/>
   * If registering Mockito mocks, use {@link #registerService(float, Object, Class)} instead.
   */
  public static List<IBean<?>> registerServices(float priority, Object... services) {
    if (services == null) {
      return CollectionUtility.emptyArrayList();
    }
    List<IBean<?>> registeredBeans = new ArrayList<>();

    for (Object service : services) {
      Assertions.assertFalse(Mockito.mockingDetails(service).isMock(), "Cannot register mocked bean. Use 'registerService' and provide the concrete type. [mock=%s]", service);
// TODO [dwi][mvi]: enable concrete class resolution for mocks once running without OSGI.
//      if (Mockito.mockingDetails(service).isMock()) {
//        Class clazz = new MockUtil().getMockHandler(service).getMockSettings().getTypeToMock();
//      }

      registeredBeans.add(registerService(priority, service, service.getClass()));
    }
    return registeredBeans;
  }

  /**
   * Registers the given service under the given type in the current {@link IBeanContext} and returns its registration.
   */
  public static <SERVICE> IBean<SERVICE> registerService(float priority, SERVICE object, Class<? extends SERVICE> clazz) {
    BeanImplementor<SERVICE> bean = new BeanImplementor<>(clazz);
    bean.addAnnotation(AnnotationFactory.createApplicationScoped());
    bean.addAnnotation(AnnotationFactory.createPriority(priority));
    Platform.get().getBeanContext().registerBean(bean, object);
    return bean;
  }

  /**
   * Unregisters the given services.
   *
   * @param dynamicServices
   */
  public static void unregisterServices(List<? extends IBean<?>> beans) {
    if (beans == null) {
      return;
    }
    for (IBean<?> bean : beans) {
      Platform.get().getBeanContext().unregisterBean(bean);
    }
  }

  /**
   * Clears Java's HTTP authentication cache.
   *
   * @return Returns <code>true</code> if the operation was successful, otherwise <code>false</code>.
   */
  public static boolean clearHttpAuthenticationCache() {
    boolean successful = true;
    try {
      Class<?> c = Class.forName("sun.net.www.protocol.http.AuthCacheValue");
      Field cacheField = c.getDeclaredField("cache");
      cacheField.setAccessible(true);
      Object cache = cacheField.get(null);
      Field hashtableField = cache.getClass().getDeclaredField("hashtable");
      hashtableField.setAccessible(true);
      Map<?, ?> map = (Map<?, ?>) hashtableField.get(cache);
      map.clear();
    }
    catch (Throwable t) {
      successful = false;
    }
    return successful;
  }

  /**
   * convenience overload for {@link #createLocaleSpecificNumberString(minus, integerPart, fractionPart, percent)} with
   * <code>percent=0</code>
   *
   * @param minus
   * @param integerPart
   * @param fractionPart
   * @return
   */
  public static String createLocaleSpecificNumberString(Locale loc, boolean minus, String integerPart, String fractionPart) {
    return createLocaleSpecificNumberString(loc, minus, integerPart, fractionPart, NumberStringPercentSuffix.NONE);
  }

  /**
   * convenience overload for {@link #createLocaleSpecificNumberString(minus, integerPart, fractionPart, percent)} with
   * <code>fractionPart=null</code> and <code>percent=0</code>
   *
   * @param minus
   * @param integerPart
   * @return
   */
  public static String createLocaleSpecificNumberString(Locale loc, boolean minus, String integerPart) {
    return createLocaleSpecificNumberString(loc, minus, integerPart, null, NumberStringPercentSuffix.NONE);
  }

  public enum NumberStringPercentSuffix {
    /**
     * ""
     */
    NONE {
      @Override
      public String getSuffix(DecimalFormatSymbols symbols) {
        return "";
      }
    },
    /**
     * "%"
     */
    JUST_SYMBOL {
      @Override
      public String getSuffix(DecimalFormatSymbols symbols) {
        return String.valueOf(symbols.getPercent());
      }
    },
    /**
     * " %'
     */
    BLANK_AND_SYMBOL {
      @Override
      public String getSuffix(DecimalFormatSymbols symbols) {
        return " " + symbols.getPercent();
      }
    };

    public abstract String getSuffix(DecimalFormatSymbols symbols);
  }

  /**
   * Create a string representing a number using locale specific minus, decimalSeparator and percent symbols
   *
   * @param minus
   * @param integerPart
   * @param fractionPart
   * @param percentSuffix
   * @return
   */
  public static String createLocaleSpecificNumberString(Locale loc, boolean minus, String integerPart, String fractionPart, NumberStringPercentSuffix percentSuffix) {
    DecimalFormatSymbols symbols = ((DecimalFormat) DecimalFormat.getPercentInstance(loc)).getDecimalFormatSymbols();
    StringBuilder sb = new StringBuilder();
    if (minus) {
      sb.append(symbols.getMinusSign());
    }
    sb.append(integerPart);
    if (fractionPart != null) {
      sb.append(symbols.getDecimalSeparator()).append(fractionPart);
    }
    sb.append(percentSuffix.getSuffix(symbols));
    return sb.toString();
  }

}
