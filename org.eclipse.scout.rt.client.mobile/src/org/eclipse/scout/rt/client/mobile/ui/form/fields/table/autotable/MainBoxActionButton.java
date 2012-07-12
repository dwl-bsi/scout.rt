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
package org.eclipse.scout.rt.client.mobile.ui.form.fields.table.autotable;

import org.eclipse.scout.rt.client.mobile.ui.action.ActionWrappingButton;
import org.eclipse.scout.rt.client.ui.action.IAction;

public class MainBoxActionButton extends ActionWrappingButton {

  public MainBoxActionButton(IAction action) {
    super(action);
  }

  @Override
  protected boolean getConfiguredProcessButton() {
    return true;
  }

}
