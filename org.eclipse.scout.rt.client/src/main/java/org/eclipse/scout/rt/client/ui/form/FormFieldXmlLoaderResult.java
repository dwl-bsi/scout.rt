/*
 * Copyright (c) 2010, 2024 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.scout.rt.client.ui.form;

import org.eclipse.scout.rt.platform.util.TypeCastUtility;

public class FormFieldXmlLoaderResult {

  private boolean m_hasError;
  private String m_value;
  private ValueState m_valueState;

  public FormFieldXmlLoaderResult() {
    m_valueState = ValueState.HUMAN_READABLE;
  }

  public void setHasError(boolean hasError) {
    m_hasError = hasError;
  }

  public boolean isHasError() {
    return m_hasError;
  }

  public String getValue() {
    return m_value;
  }

  public void add(FormFieldXmlLoaderResult other) {
    m_hasError &= other.m_hasError;
    m_value = other.m_value;
    m_valueState = other.m_valueState;
  }

  public void setValue(Object value) {
    try {
      m_value = TypeCastUtility.castValue(value, String.class);
    }
    catch (Exception e) {
      m_value = null;
      m_valueState = ValueState.NOT_HUMAN_READABLE;
    }
  }

  public ValueState getValueState() {
    return m_valueState;
  }

  public void setValueState(ValueState valueState) {
    m_valueState = valueState;
  }

  public enum ValueState {
    DESERIALIZATION_FAILED,
    NOT_HUMAN_READABLE,
    HUMAN_READABLE
  }
}
