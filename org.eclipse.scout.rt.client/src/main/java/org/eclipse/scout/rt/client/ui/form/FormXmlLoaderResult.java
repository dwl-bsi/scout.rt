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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.eclipse.scout.rt.client.ui.form.AbstractForm.FormXmlPropertiesLoaderResult;
import org.eclipse.scout.rt.client.ui.form.fields.IFormField;
import org.eclipse.scout.rt.platform.util.StringUtility;

public class FormXmlLoaderResult {

  private boolean m_isFatalError;
  private Map<String, String> m_invalidProperties;
  private Map<String, String> m_unknownFields;
  private Map<String, String> m_invalidFields;

  public FormXmlLoaderResult() {
    m_isFatalError = false;
    m_invalidProperties = new HashMap<>();
    m_unknownFields = new HashMap<>();
    m_invalidFields = new HashMap<>();
  }

  private String getFieldId(List<String> xmlFieldIds) {
    return StringUtility.join(".", xmlFieldIds);
  }

  public void addUnknownField(List<String> xmlFieldIds, String value) {
    m_unknownFields.put(getFieldId(xmlFieldIds), value);
  }

  public void addUnknownFieldWithInvalidValue(List<String> xmlFieldIds) {
    m_unknownFields.put(getFieldId(xmlFieldIds), null);
  }

  public void add(IFormField f, List<String> xmlFieldIds, FormFieldXmlLoaderResult fieldResult) {
    if (fieldResult.isHasError()) {
      addFieldWithInvalidValue(f, xmlFieldIds, fieldResult.getValue());
    }
  }

  public void markFatalError() {
    m_isFatalError = true;
  }

  public void addFieldWithInvalidValue(IFormField formField, List<String> xmlFieldIds, String value) {
    String label = formField.getLabel();
    String fieldName;
    if (StringUtility.hasText(label)) {
      fieldName = StringUtility.concatenateTokens(label, "(", getFieldId(xmlFieldIds), ")");
    }
    else {
      fieldName = getFieldId(xmlFieldIds);
    }
    m_invalidFields.put(fieldName, value);
  }

  public void add(FormXmlPropertiesLoaderResult propertiesLoaderResult) {
    m_invalidProperties = propertiesLoaderResult.getPropertiesWithInvalidValues();
  }

  public boolean isFatalError() {
    return m_isFatalError;
  }

  public boolean isHasErrors() {
    return isFatalError() || !m_invalidProperties.isEmpty() || !m_invalidFields.isEmpty() || !m_unknownFields.isEmpty();
  }

  public Map<String, String> getInvalidProperties() {
    return m_invalidProperties;
  }

  public Map<String, String> getUnknownFields() {
    return m_unknownFields;
  }

  public Map<String, String> getInvalidFields() {
    return m_invalidFields;
  }
}
