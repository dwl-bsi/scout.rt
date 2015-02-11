// SCOUT GUI
// (c) Copyright 2013-2014, BSI Business Systems Integration AG

// FIXME CRU: implement buttons to show/hide, add/remove columns depending on 'custom' property.
scout.TableHeaderMenu = function(table, $header, x, y, session) {
  var pos = table.header.getColumnViewIndex($header),
    column = $header.data('column');

  // label title
  $header.addClass('menu-open');

  // create container
  var $menuHeader = table.$container.appendDiv('table-header-menu')
    .css('left', x).css('top', y + $header.parent().height() + 1);

  $menuHeader.appendDiv('table-header-menu-whiter').width($header[0].offsetWidth - 2);

  this.$headerMenu = $menuHeader;
  this.$header = $header;

  // every user action will close menu
  $('body').on('mousedown.remove', onMouseDown);
  $('body').on('keydown.remove', removeMenu);

  // create buttons in command for order
  var $commandMove = $menuHeader.appendDiv('header-group');
  $commandMove.appendDiv('header-text')
    .data('label', session.text('Move'));

  $commandMove.appendDiv('header-command move-top')
    .data('label', session.text('toBegin'))
    .click(moveTop);
  $commandMove.appendDiv('header-command move-up')
    .data('label', session.text('forward'))
    .click(moveUp);
  $commandMove.appendDiv('header-command move-down')
    .data('label', session.text('backward'))
    .click(moveDown);
  $commandMove.appendDiv('header-command move-bottom')
    .data('label', session.text('toEnd'))
    .click(moveBottom);

  // create buttons in command for sorting
  var $commandSort = $menuHeader.appendDiv('header-group');
  $commandSort.appendDiv('header-text')
    .data('label', session.text('ColumnSorting'));

  var $sortAsc = $commandSort.appendDiv('header-command sort-asc')
    .data('label', session.text('ascending'))
    .click(this.remove.bind(this))
    .click(function() {
      sort('asc', false, $(this).hasClass('selected'));
    });
  var $sortDesc = $commandSort.appendDiv('header-command sort-desc')
    .data('label', session.text('descending'))
    .click(this.remove.bind(this))
    .click(function() {
      sort('desc', false, $(this).hasClass('selected'));
    });

  var $sortAscAdd = $commandSort.appendDiv('header-command sort-asc-add')
    .data('label', session.text('ascendingmultiSortly'))
    .click(this.remove.bind(this))
    .click(function() {
      sort('asc', true, $(this).hasClass('selected'));
    });
  var $sortDescAdd = $commandSort.appendDiv('header-command sort-desc-add')
    .data('label', session.text('descendingmultiSortly'))
    .click(this.remove.bind(this))
    .click(function() {
      sort('desc', true, $(this).hasClass('selected'));
    });

  sortSelect();

  // create buttons in command for grouping
  if (column.type === 'text' || column.type === 'date') {
    var $commandGroup = $menuHeader.appendDiv('header-group');
    $commandGroup.appendDiv('header-text')
      .data('label', session.text('Sum'));

    var $groupAll = $commandGroup.appendDiv('header-command group-all')
      .data('label', session.text('overEverything'))
      .click(this.remove.bind(this))
      .click(groupAll);

    var $groupSort = $commandGroup.appendDiv('header-command group-sort')
      .data('label', session.text('grouped'))
      .click(this.remove.bind(this))
      .click(groupSort);

    groupSelect();
  }

  // create buttons in command for coloring
  if (column.type === 'number') {
    var $commandColor = $menuHeader.appendDiv('header-group');
    $commandColor.appendDiv('header-text')
      .data('label', session.text('ColorCells'));

    $commandColor.appendDiv('header-command color-red')
      .data('label', session.text('fromRedToGreen'))
      .click(this.remove.bind(this))
      .click(colorRed);
    $commandColor.appendDiv('header-command color-green')
      .data('label', session.text('fromGreenToRed'))
      .click(this.remove.bind(this))
      .click(colorGreen);
    $commandColor.appendDiv('header-command color-bar')
      .data('label', session.text('withBarGraph'))
      .click(this.remove.bind(this))
      .click(colorBar);
    $commandColor.appendDiv('header-command color-remove')
      .data('label', session.text('remove'))
      .click(this.remove.bind(this))
      .click(colorRemove);
  }

  // create buttons in command for new columns
  var $commandColumn = $menuHeader.appendDiv('header-group');
  $commandColumn.appendDiv('header-text')
    .data('label', session.text('Column'));

  $commandColumn.appendDiv('header-command column-add')
    .data('label', session.text('add'))
    .click(columnAdd);
  $commandColumn.appendDiv('header-command column-remove')
    .data('label', session.text('remove'))
    .click(columnRemove);

  // filter
  var $headerFilter = $menuHeader.appendDiv('header-group-filter');
  $headerFilter.appendDiv('header-text')
    .data('label', session.text('FilterBy'));

  var group = (column.type === 'date') ? 3 : -1,
    matrix = new scout.ChartTableControlMatrix(table, session),
    xAxis = matrix.addAxis(column, group),
    cube = matrix.calculateCube();

  var $headerFilterContainer = $headerFilter.appendDiv('header-filter-container');
  scout.scrollbars.install($headerFilterContainer);

  for (var a = 0; a < xAxis.length; a++) {
    var key = xAxis[a],
      mark = xAxis.format(key),
      value = cube.getValue([key]).length;

    var $filter = $headerFilterContainer.appendDiv('header-filter', mark)
      .attr('data-xAxis', key)
      .click(filterClick)
      .attr('data-value', value);

    if (column.filter.indexOf(key) > -1) {
      $filter.addClass('selected');
    }
  }

  var containerHeight = $headerFilterContainer.get(0).offsetHeight,
    scrollHeight = $headerFilterContainer.get(0).scrollHeight;

  if (containerHeight >= scrollHeight) {
    $headerFilterContainer.css('height', 'auto');
    scrollHeight = $headerFilterContainer.get(0).offsetHeight;
    $headerFilterContainer.css('height', scrollHeight);
  }

  // name all label elements
  $('.header-text').each(function() {
    $(this).text($(this).data('label'));
  });

  // set events to buttons
  $menuHeader
    .on('mouseenter click', '.header-command', enterCommand)
    .on('mouseleave', '.header-command', leaveCommand);

  // copy flags to menu
  if ($header.hasClass('sort-asc')) {
    $menuHeader.addClass('sort-asc');
  }
  if ($header.hasClass('sort-desc')) {
    $menuHeader.addClass('sort-desc');
  }
  if ($header.hasClass('filter')) {
    $menuHeader.addClass('filter');
  }

  var that = this;

  function onMouseDown(event) {
    if ($header.is($(event.target))) {
      return;
    }

    removeMenu(event);
  }

  function removeMenu(event) {
    if ($menuHeader.has($(event.target)).length === 0) {
      that.remove();
    }
  }

  // event handling
  function enterCommand() {
    var $command = $(this),
      $text = $command.siblings('.header-text'),
      text = $command.hasClass('selected') ? session.text('remove') : $command.data('label');

    $text.text($text.data('label') + ' ' + text);
  }

  function leaveCommand() {
    var $command = $(this),
      $text = $command.siblings('.header-text');

    $text.text($text.data('label'));
  }

  function moveTop() {
    table.moveColumn($header, pos, 0);
    pos = table.header.getColumnViewIndex($header);
  }

  function moveUp() {
    table.moveColumn($header, pos, Math.max(pos - 1, 0));
    pos = table.header.getColumnViewIndex($header);
  }

  function moveDown() {
    table.moveColumn($header, pos, Math.min(pos + 1, table.header.findHeaderItems().length - 1));
    pos = table.header.getColumnViewIndex($header);
  }

  function moveBottom() {
    table.moveColumn($header, pos, table.header.findHeaderItems().length - 1);
    pos = table.header.getColumnViewIndex($header);
  }

  function sort(direction, multiSort, remove) {
    var column = $header.data('column');
    table.group(column, false, false);
    table.sort(column, direction, multiSort, remove);

    sortSelect();
    groupSelect();
  }

  function sortSelect() {
    var addIcon = '\uF067',
      sortCount = getSortColumnCount(),
      column = $header.data('column');

    $('.header-command', $commandSort).removeClass('selected');

    if (sortCount === 1) {
      if ($header.hasClass('sort-asc')) {
        $sortAsc.addClass('selected');
        addIcon = null;
      } else if ($header.hasClass('sort-desc')) {
        $sortDesc.addClass('selected');
        addIcon = null;
      }
    } else if (sortCount > 1) {
      if ($header.hasClass('sort-asc')) {
        $sortAscAdd.addClass('selected');
        addIcon = column.sortIndex + 1;
      } else if ($header.hasClass('sort-desc')) {
        $sortDescAdd.addClass('selected');
        addIcon = column.sortIndex + 1;
      }
    } else {
      addIcon = null;
    }

    if (addIcon) {
      $sortAscAdd.show().attr('data-icon', addIcon);
      $sortDescAdd.show().attr('data-icon', addIcon);
    } else {
      $sortAscAdd.hide();
      $sortDescAdd.hide();
    }
  }

  function getSortColumnCount() {
    var sortCount = 0;

    for (var i = 0; i < table.columns.length; i++) {
      if (table.columns[i].sortActive) {
        sortCount++;
      }
    }

    return sortCount;
  }

  function groupAll() {
    table.group($header.data('column'), !$(this).hasClass('selected'), true);

    sortSelect();
    groupSelect();
  }

  function groupSort() {
    table.group($header.data('column'), !$(this).hasClass('selected'), false);

    sortSelect();
    groupSelect();
  }

  function groupSelect() {
    $groupAll.removeClass('selected');
    $groupSort.removeClass('selected');

    if ($header.parent().hasClass('group-all')) {
      $groupAll.addClass('selected');
    }
    if ($header.hasClass('group-sort')) {
      $groupSort.addClass('selected');
    }
  }

  function colorRed() {
    table.colorData('red', column);
  }

  function colorGreen() {
    table.colorData('green', column);
  }

  function colorBar() {
    table.colorData('bar', column);
  }

  function colorRemove() {
    table.colorData('remove', column);
  }

  function columnAdd() {}

  function columnChange() {}

  function columnRemove() {}

  function filterClick(event) {
    var $clicked = $(this);

    // change state
    if ($clicked.hasClass('selected')) {
      $clicked.removeClass('selected');
    } else {
      $clicked.addClass('selected');
    }

    //  prepare filter
    column.filter = [];

    //  find filter
    $('.selected', $headerFilter).each(function() {
      var dX = parseFloat($(this).attr('data-xAxis'));
      column.filter.push(dX);
    });

    // filter function
    if (column.filter.length) {
      column.filterFunc = function($row) {
        var row = table.rowById($row.attr('id')),
          textX = table.cellValue(xAxis.column, row),
          nX = xAxis.norm(textX);
        return (column.filter.indexOf(nX) > -1);
      };
    } else {
      column.filterFunc = null;
    }

    // callback to table
    table.filter();
  }
};

scout.TableHeaderMenu.prototype.remove = function() {
  this.$headerMenu.remove();
  this.$header.removeClass('menu-open');
  $('body').off('mousedown.remove');
  $('body').off('keydown.remove');
};

scout.TableHeaderMenu.prototype.isOpenFor = function($header) {
  return this.$header.is($header) && this.$header.hasClass('menu-open');
};

scout.TableHeaderMenu.prototype.isOpen = function() {
  return this.$header.hasClass('menu-open');
};
