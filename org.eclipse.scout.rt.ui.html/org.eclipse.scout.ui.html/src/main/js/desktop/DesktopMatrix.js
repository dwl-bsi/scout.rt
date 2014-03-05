// SCOUT GUI
// (c) Copyright 2013-2014, BSI Business Systems Integration AG

Scout.DesktopMatrix = function (columns, table) {
  this._allData = [];
  this._allAxis = [];
  this._columns = columns;
  this._table = table;
};

/**
 * add data axis
 */
Scout.DesktopMatrix.prototype.addData = function (data, dataGroup) {
  var dataAxis = [];

  // collect all axis
  this._allData.push(dataAxis);

  // copy column for later access
  dataAxis.column = data;

  // data always is number
  dataAxis.format = function (n) {return $.numberToString(n, 0); };

  // count, sum, avg
  if (dataGroup == -1) {
    dataAxis.norm = function (f) {return 1; };
    dataAxis.group = function (array) {return array.length; };
  } else if (dataGroup == 1) {
    dataAxis.norm = function (f) {return parseFloat(f); };
    dataAxis.group = function (array) {return array.reduce(function(a, b) {return a + b; }); };
  } else if (dataGroup == 2) {
    dataAxis.norm = function (f) {return parseFloat(f); };
    dataAxis.group = function (array) {return array.reduce(function(a, b) {return a + b; }) / array.length; };
  }

  return dataAxis;
};

  //add x or y Axis
Scout.DesktopMatrix.prototype.addAxis = function (axis, axisGroup) {
  var keyAxis = [];

  // collect all axis
  this._allAxis.push(keyAxis);
  keyAxis.column = axis;

  // normalized sring data
  keyAxis.normTable = [];

  // add a key to the axis
  keyAxis.add = function (k) { if (keyAxis.indexOf(k) == -1) keyAxis.push(k); };

  // default sorts function
  keyAxis.reorder = function () { keyAxis.sort(); };

  // norm and format depends of datatype and group functionality
  if (this._columns[axis].type == 'date') {
    if (axisGroup === 0) {
      keyAxis.norm = function (f) {return $.stringToDate(f).getTime(); };
      keyAxis.format = function (n) {return $.dateToString(new Date(n)); };
    } else if (axisGroup === 1) {
      keyAxis.norm = function (f) {return ($.stringToDate(f).getDay() + 6) % 7; };
      keyAxis.format = function (n) {return $.WEEKDAY_LONG[n]; };
    } else if (axisGroup === 2) {
      keyAxis.norm = function (f) {return $.stringToDate(f).getMonth(); };
      keyAxis.format = function (n) {return $.MONTH_LONG[n]; };
    } else if (axisGroup === 3) {
      keyAxis.norm = function (f) {return $.stringToDate(f).getFullYear(); };
      keyAxis.format = function (n) {return String(n); };
    }
  } else if (this._columns[axis].type == 'int'){
    keyAxis.norm = function (f) {return parseInt(f, 10); };
    keyAxis.format = function (n) {return $.numberToString(n, 0); };
  } else if (this._columns[axis].type == 'float'){
    keyAxis.norm = function (f) {return parseFloat(f); };
    keyAxis.format = function (n) {return $.numberToString(n, 0); };
  } else {
    keyAxis.norm = function (f) {var index =  keyAxis.normTable.indexOf(f);
                  if (index == -1) {
                    return  keyAxis.normTable.push(f) - 1;
                  } else {
                    return index;
                  } };
    keyAxis.format = function (n) { return keyAxis.normTable[n]; };
    keyAxis.reorder = function () { log('TODO');};

  }

  return keyAxis;
};

Scout.DesktopMatrix.prototype.calculateCube = function () {
  var cube = {},
    r, v, k, data;

  // collect data from table
  for (r = 0; r < this._table.length; r++) {
    // collect keys of x, y axis from row
    var keys = [];
    for (k = 0; k < this._allAxis.length; k++) {
      key = this._table[r][this._allAxis[k].column];
      normKey = this._allAxis[k].norm(key);

      this._allAxis[k].add(normKey);
      keys.push(normKey);
    }
    keys = JSON.stringify(keys);

    // collect values of data axis from row
    var values = [];
    for (v = 0; v < this._allData.length; v++) {
      data = this._table[r][this._allData[v].column];
      normData = this._allData[v].norm(data);

      values.push(normData);
    }

    // build cube
    if (cube[keys]) {
      cube[keys].push(values);
    } else {
      cube[keys] = [values];
    }
  }

  // group values and find sum, min and max of data axis
  for (v = 0; v < this._allData.length; v++) {
    data = this._allData[v];

    data.total = 0;
    data.min = null;
    data.max = null;

    for (var k in cube) {
      if (cube.hasOwnProperty(k)) {
        var allCell = cube[k],
          subCell = [];

        for (var i = 0; i < allCell.length; i++) {
          subCell.push(allCell[i][v]);
        }

        var newValue = this._allData[v].group(subCell);
        cube[k][v] = newValue;
        data.total += newValue;

        if (newValue < data.min || data.min === null) data.min = newValue;
        if (newValue > data.max || data.min === null) data.max = newValue;
      }
    }

    var f = Math.ceil(Math.log(data.max) / Math.LN10) - 1;

    data.max = Math.ceil(data.max / Math.pow(10, f)) * Math.pow(10, f);
    data.max = Math.ceil(data.max / 4) * 4;
  }

  // find dimensions and sort for x, y axis
  for (k = 0; k < this._allAxis.length; k++) {
    key = this._allAxis[k];

    key.min = Math.min.apply(null, key);
    key.max = Math.max.apply(null, key);

    key.reorder();
  }

  // acces function used by chart
  cube.getValue = function (keys) {
    keys = JSON.stringify(keys);

    if (cube.hasOwnProperty(keys)) {
      return cube[keys];
    } else {
      return null;
    }
  };

  return cube;
};

Scout.DesktopMatrix.prototype.columnCount = function () {
  var colCount = [];

  for (var c = 0; c < this._columns.length; c++) {
    colCount.push([c, []]);
    if (this._columns[c].type != 'key') {
      for (var r = 0; r < this._table.length; r++) {
        var v = this._table[r][c];
        if (colCount[c][1].indexOf(v) == -1) colCount[c][1].push(v);
      }

      colCount[c][1] = colCount[c][1].length;
    }
  }
  return colCount;
};
