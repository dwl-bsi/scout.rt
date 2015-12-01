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
package org.eclipse.scout.rt.ui.html.res.loader;

import java.util.regex.Matcher;

import javax.servlet.http.HttpServletRequest;

import org.eclipse.scout.rt.platform.resource.BinaryResource;
import org.eclipse.scout.rt.ui.html.IUiSession;
import org.eclipse.scout.rt.ui.html.cache.HttpCacheKey;
import org.eclipse.scout.rt.ui.html.cache.HttpCacheObject;
import org.eclipse.scout.rt.ui.html.cache.HttpResponseHeaderContributor;
import org.eclipse.scout.rt.ui.html.cache.IHttpCacheControl;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.res.BinaryResourceHolder;
import org.eclipse.scout.rt.ui.html.res.BinaryResourceUrlUtility;
import org.eclipse.scout.rt.ui.html.res.IBinaryResourceProvider;

/**
 * This class loads resources that are temporary or dynamically registered on the {@link IUiSession}. This includes
 * adapter/form-fields such as the image field, WordAddIn docx documents, temporary and time-limited landing page files
 * etc.
 * <p>
 * The pathInfo is expected to have the following form: <code>/dynamic/[uiSessionId]/[adapterId]/[filename]</code>
 */
public class DynamicResourceLoader extends AbstractResourceLoader {

  public DynamicResourceLoader(HttpServletRequest req) {
    super(req);
  }

  @Override
  public HttpCacheObject loadResource(HttpCacheKey cacheKey) {
    String pathInfo = cacheKey.getResourcePath();
    Matcher m = BinaryResourceUrlUtility.PATTERN_DYNAMIC_ADAPTER_RESOURCE_PATH.matcher(pathInfo);
    if (!m.matches()) {
      return null;
    }
    String uiSessionId = m.group(1);
    String adapterId = m.group(2);
    String filename = m.group(3);

    IUiSession uiSession = (IUiSession) getSession().getAttribute(IUiSession.HTTP_SESSION_ATTRIBUTE_PREFIX + uiSessionId);
    if (uiSession == null) {
      return null;
    }
    IJsonAdapter<?> jsonAdapter = uiSession.getJsonAdapter(adapterId);
    if (!(jsonAdapter instanceof IBinaryResourceProvider)) {
      return null;
    }
    IBinaryResourceProvider provider = (IBinaryResourceProvider) jsonAdapter;
    BinaryResourceHolder binaryResource = provider.provideBinaryResource(filename);
    if (binaryResource == null || binaryResource.get() == null) {
      return null;
    }
    String contentType = binaryResource.get().getContentType();
    if (contentType == null) {
      contentType = detectContentType(pathInfo);
    }
    BinaryResource content = new BinaryResource(pathInfo, contentType, binaryResource.get().getContent(), binaryResource.get().getLastModified());
    HttpCacheObject httpCacheObject = new HttpCacheObject(cacheKey, content.getLastModified() > 0, IHttpCacheControl.MAX_AGE_4_HOURS, content);
    if (binaryResource.isDownload()) {
      // Set hint for browser to show the "save as" dialog (no in-line display, not even for known types, e.g. XML)
      httpCacheObject.addHttpResponseInterceptor(new HttpResponseHeaderContributor("Content-Disposition", "attachment"));
    }
    return httpCacheObject;
  }

}
