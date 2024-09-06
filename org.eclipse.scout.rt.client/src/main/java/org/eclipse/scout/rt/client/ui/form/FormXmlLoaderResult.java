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

import org.eclipse.scout.rt.client.ui.form.fields.IFormField;
import org.eclipse.scout.rt.platform.util.CollectionUtility;
import org.eclipse.scout.rt.platform.util.StringUtility;

public class FormXmlLoaderResult {

  private boolean m_isUnexpectedError;
  private String m_scoutCorrelationId;

  // a null value means that there was an error parsing the object
  private Map<FieldDescriptor, Object> m_invalidProperties;
  private Map<FieldDescriptor, Object> m_unknownFields;
  private Map<FieldDescriptor, Object> m_invalidFields;

  public FormXmlLoaderResult() {
    m_isUnexpectedError = false;
    m_invalidProperties = new HashMap<>();
    m_unknownFields = new HashMap<>();
    m_invalidFields = new HashMap<>();
  }

  public void addUnknownField(List<String> xmlFieldIds, Object value) {
    m_unknownFields.put(new FieldDescriptor(xmlFieldIds, null), value);
  }

  public void addUnknownFieldWithInvalidValue(List<String> xmlFieldIds) {
    m_unknownFields.put(new FieldDescriptor(xmlFieldIds, null), null);
  }

  public void addFieldWithInvalidValue(IFormField formField, List<String> xmlFieldIds, Object value) {
    String label = formField.getLabel();
    m_invalidFields.put(new FieldDescriptor(xmlFieldIds, label), value);
  }

  public void addFieldWithInvalidValue(IFormField formField) {
    addFieldWithInvalidValue(formField, null, null);
  }

  public void combineWith(List<String> xmlFieldIds, FormXmlLoaderResult fieldResult) {
    fieldResult.getInvalidFields().forEach((d, v) -> combineWith(xmlFieldIds, d, v, m_invalidFields));
    fieldResult.getUnknownFields().forEach((d, v) -> combineWith(xmlFieldIds, d, v, m_unknownFields));
    fieldResult.getInvalidProperties().forEach((d, v) -> combineWith(xmlFieldIds, d, v, m_invalidProperties));
  }

  private void combineWith(List<String> xmlFieldIds, FieldDescriptor descriptor, Object value, Map<FieldDescriptor, Object> fields) {
    descriptor.setFieldIds(CollectionUtility.combine(xmlFieldIds, descriptor.getFieldIds()));
    fields.put(descriptor, value);
  }

  public void markFatalError() {
    m_isUnexpectedError = true;
  }

  public boolean isUnexpectedError() {
    return m_isUnexpectedError;
  }

  public String getScoutCorrelationId() {
    return m_scoutCorrelationId;
  }

  public void setScoutCorrelationId(String scoutCorrelationId) {
    m_scoutCorrelationId = scoutCorrelationId;
  }

  public boolean isHasErrors() {
    return isUnexpectedError() || !m_invalidProperties.isEmpty() || !m_invalidFields.isEmpty() || !m_unknownFields.isEmpty();
  }

  public Map<FieldDescriptor, Object> getInvalidProperties() {
    return m_invalidProperties;
  }

  public Map<FieldDescriptor, Object> getUnknownFields() {
    return m_unknownFields;
  }

  public Map<FieldDescriptor, Object> getInvalidFields() {
    return m_invalidFields;
  }

  public void addPropertyWithInvalidValue(String propertyName) {
    addPropertyWithInvalidValue(propertyName, null);
  }

  public void addPropertyWithInvalidValue(String propertyName, Object value) {
    m_invalidProperties.put(new FieldDescriptor(propertyName), value);
  }

  public static class FieldDescriptor {
    private List<String> m_fieldIds;
    private String m_label;

    public FieldDescriptor(String fieldId) {
      this(List.of(fieldId));
    }

    public FieldDescriptor(List<String> fieldIds) {
      this(fieldIds, null);
    }

    public FieldDescriptor(List<String> fieldIds, String label) {
      m_fieldIds = fieldIds;
      m_label = label;
    }

    public List<String> getFieldIds() {
      return m_fieldIds;
    }

    public void setFieldIds(List<String> fieldIds) {
      m_fieldIds = fieldIds;
    }

    public String getLabel() {
      return m_label;
    }

    public void setLabel(String label) {
      m_label = label;
    }

    @Override
    public String toString() {
      StringBuilder result = new StringBuilder();
      if (StringUtility.hasText(m_label)) {
        result.append(m_label).append(" (");
        result.append(appendFieldIds());
        result.append(")");
      }
      else {
        result.append(appendFieldIds());
      }
      return result.toString();
    }

    private String appendFieldIds() {
      if (m_fieldIds != null) {
        return String.join(".", m_fieldIds);
      }
      return "";
    }
  }
}
