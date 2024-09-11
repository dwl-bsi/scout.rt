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

public class FormXmlLoaderResult {

  private boolean m_hasErrors;

  public boolean isHasErrors() {
    return m_hasErrors;
  }

  public void notifyError() {
    m_hasErrors = true;
  }
}
