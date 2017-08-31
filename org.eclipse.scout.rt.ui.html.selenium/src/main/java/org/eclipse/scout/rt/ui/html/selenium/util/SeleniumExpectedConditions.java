/*******************************************************************************
 * Copyright (c) 2014-2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.ui.html.selenium.util;

import java.util.Arrays;
import java.util.List;

import org.eclipse.scout.rt.platform.util.CollectionUtility;
import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;

/**
 * This class provides <code>ExceptedCondition</code>s used in Scout Selenium tests. It is used in addition to
 * Selenium's class {@link ExpectedConditions}.
 */
public final class SeleniumExpectedConditions {

  private SeleniumExpectedConditions() {
  }

  /**
   * Same as {@link ExpectedConditions#elementToBeClickable(org.openqa.selenium.By)} but with a parent element which is
   * also resolved lazy.
   */
  public static ExpectedCondition<WebElement> childElementToBeClickable(final WebElement parent, final By locator) {
    return new ExpectedCondition<WebElement>() {
      @Override
      public WebElement apply(WebDriver driver) {
        List<WebElement> elements = parent.findElements(locator);
        if (elements.size() == 1) {
          return ExpectedConditions.elementToBeClickable(elements.get(0)).apply(driver);
        }
        else {
          return null;
        }
      }
    };
  }

  /**
   * Used to wait until the given element is <em>not</em> focused anymore.
   */
  public static ExpectedCondition<Boolean> elementNotToBeFocused(final WebElement element) {
    return new ExpectedCondition<Boolean>() {
      @Override
      public Boolean apply(WebDriver driver) {
        try {
          WebElement activeElement = driver.switchTo().activeElement();
          return !activeElement.equals(element);
        }
        catch (StaleElementReferenceException e) { // NOSONAR
          return null;
        }
      }

      @Override
      public String toString() {
        return String.format("element '%s' is still focused, but shouldn't", element);
      }
    };
  }

  /**
   * Used to wait until a radio-button with the given text inside the given group is checked.
   *
   * @return
   */
  public static ExpectedCondition<WebElement> radioButtonToBeChecked(final WebElement radioButtonGroup, final String radioButtonText) {
    return new ExpectedCondition<WebElement>() {
      @Override
      public WebElement apply(WebDriver driver) {
        List<WebElement> elements = radioButtonGroup.findElements(By.cssSelector(".field.checked > .label"));
        if (elements.size() == 1) {
          return elements.get(0);
        }
        return null;
      }
    };
  }

  /**
   * Used to wait until a check-box inside the given field has the requested checked state (checked or unchecked).
   */
  public static ExpectedCondition<WebElement> checkBoxToBeChecked(final WebElement checkBoxField, final boolean checked) {
    return new ExpectedCondition<WebElement>() {
      @Override
      public WebElement apply(WebDriver driver) {
        String selector = checked ? ".checked" : ":not(.checked)";
        List<WebElement> elements = checkBoxField.findElements(By.cssSelector(".check-box" + selector));
        if (elements.size() == 1) {
          return elements.get(0);
        }
        return null;
      }
    };
  }

  /**
   * Waits until the given element has the requested attribute name and contains the given value. Example: the attribute
   * "class" of an element should contain the string "error-status".
   */
  public static ExpectedCondition<Boolean> attributeToContainValue(final WebElement element, final String attributeName, final String value) {
    return attributeToCompareValue(new TextComparator.Contains(), element, attributeName, value);
  }

  /**
   * Waits until the given element has the requested attribute name and exactly the given value. Example: the attribute
   * "class" must be equals "error-status".
   */
  public static ExpectedCondition<Boolean> attributeToEqualsValue(final WebElement element, final String attributeName, final String value) {
    return attributeToCompareValue(new TextComparator.Equals(), element, attributeName, value);
  }

  /**
   * Waits until the given element has the requested attribute name and exactly the given value, ignoring case. Example:
   * the attribute "class" must be equals "error-status".
   */
  public static ExpectedCondition<Boolean> attributeToEqualsIgnoreCaseValue(final WebElement element, final String attributeName, final String value) {
    return attributeToCompareValue(new TextComparator.EqualsIgnoreCase(), element, attributeName, value);
  }

  private static ExpectedCondition<Boolean> attributeToCompareValue(final TextComparator comparator, final WebElement element, final String attributeName, final String value) {
    return new ExpectedCondition<Boolean>() {
      private String m_actualValue = null;

      @Override
      public Boolean apply(WebDriver driver) {
        try {
          m_actualValue = element.getAttribute(attributeName);
          if (m_actualValue == null) {
            return null;
          }
          else {
            return comparator.compare(value, m_actualValue);
          }
        }
        catch (StaleElementReferenceException e) { // NOSONAR
          return null;
        }
      }

      @Override
      public String toString() {
        return String.format("element '%s' should have attribute '%s' with value '%s' using text-comparator '%s', but has value '%s'",
            element, attributeName, value, comparator.getClass().getSimpleName(), m_actualValue);
      }
    };
  }

  /**
   * Waits until the given element has the requested CSS class.
   */
  public static ExpectedCondition<Boolean> elementToHaveCssClass(final WebElement element, final String cssClass) {
    return new ExpectedCondition<Boolean>() {
      private String m_actualValue = null;

      @Override
      public Boolean apply(WebDriver driver) {
        try {
          m_actualValue = element.getAttribute("class");
          if (m_actualValue == null) {
            return null;
          }
          return hasCssClass(m_actualValue, cssClass);
        }
        catch (StaleElementReferenceException e) { // NOSONAR
          return null;
        }
      }

      @Override
      public String toString() {
        return String.format("element '%s' should have class '%s', but has '%s'",
            element, cssClass, m_actualValue);
      }
    };
  }

  private static boolean hasCssClass(String cssClass, String expectedCssClass) throws AssertionError {
    if (cssClass == null || expectedCssClass == null) {
      return false;
    }
    String[] cssClasses = cssClass.split(" ");
    String[] expectedCssClasses = expectedCssClass.split(" ");
    for (String expectedCssClassPart : expectedCssClasses) {
      if (CollectionUtility.contains(Arrays.asList(cssClasses), expectedCssClassPart)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param parentElement
   *          if not null, findElement below the given parent, if null, findElements in document
   * @param numRows
   * @return The table-rows found by the expected condition
   */
  public static ExpectedCondition<List<WebElement>> tableToHaveNumberOfRows(final WebElement parentElement, final int numRows) {
    return new ExpectedCondition<List<WebElement>>() {
      @Override
      public List<WebElement> apply(WebDriver driver) {
        try {
          By by = By.className("table-row");
          List<WebElement> tableRows = parentElement != null ? parentElement.findElements(by) : driver.findElements(by);
          if (numRows == tableRows.size()) {
            return tableRows;
          }
        }
        catch (StaleElementReferenceException e) { // NOSONAR
          // NOP
        }
        return null;
      }

      @Override
      public String toString() {
        return String.format("table should have %d rows", numRows);
      }
    };
  }

  /**
   * @param parentElement
   *          if not null, findElement below the given parent, if null, findElements in document
   * @param rowText
   *          text of element table-row, compared with 'contains'
   * @param numRows
   * @return The table-rows found by the expected condition
   */
  public static ExpectedCondition<List<WebElement>> tableToHaveNumberOfRows(final WebElement parentElement, final String rowText, final int numRows) {
    return new ExpectedCondition<List<WebElement>>() {
      @Override
      public List<WebElement> apply(WebDriver driver) {
        try {
          By by = By.className("table-row");
          List<WebElement> tableRows = parentElement != null ? parentElement.findElements(by) : driver.findElements(by);
          // we must have exactly the requested count of rows (too many rows is as bad as too few rows)
          if (numRows != tableRows.size()) {
            return null;
          }
          // and each one of these rows must contain the given text
          for (WebElement tableRow : tableRows) {
            if (!tableRow.getText().contains(rowText)) {
              return null;
            }
          }
          return tableRows;
        }
        catch (StaleElementReferenceException e) { // NOSONAR
          // NOP
        }
        return null;
      }

      @Override
      public String toString() {
        return String.format("table should have %d rows with text '%s'", numRows, rowText);
      }
    };
  }
}
