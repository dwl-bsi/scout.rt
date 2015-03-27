/*******************************************************************************
 * Copyright (c) 2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.commons.html;

/**
 * A html element
 */
public interface IHtmlElement extends CharSequence, IHtmlContent {

  /**
   * Add a css class
   */
  IHtmlElement clazz(CharSequence clazz);

  /**
   * Add a css style
   */
  IHtmlElement style(CharSequence style);

}
