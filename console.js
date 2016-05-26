
/*  Display and log messages
 */
function log(msg)
{
  console.log(msg);
  var c = document.getElementById("console");
  var x_scroll = c.scrollHeight - c.clientHeight <= c.scrollTop + 1;

  c.innerHTML = c.innerHTML.concat(msg+"\r\n");

  if (x_scroll)
    c.scrollTop = c.scrollHeight - c.clientHeight;
}
