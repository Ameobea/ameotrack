'use strict';

var i = 0;

var req = cb => {
  return new Promise((f, r) => {
    $.get(`./manage/get?start=${i}&end=${i + 24}&password=${pass}`, data => {
      //as safe as it gets
      f(eval(data));
    });
  });
};

var disp = urls => {
  var html = '';
  for (var i = 0; i < 6; i++) {
    html += '<tr>';
    for (var j = 0; j < 4; j++) {
      let url = urls[4 * i + j];
      html += `<td><a href="${url}" target="_blank"><img src="${url}"></td>`;
    }
    html += '</tr>\n';
  }
  $('#mainTable').html(html);
};

var next = () => {
  i += 24;
  req().then(disp);
};

var back = () => {
  i -= 24;
  disp(req());
};

$(document).ready(() => {
  $('#back').click(back);
  $('#next').click(next);
  req().then(disp);
});
