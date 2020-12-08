
const sirv = require('../apis/sirv');
var token_str = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6Ik82UlVpQUtWejVJekh4NkNWT1dzR3FXOEpHSSIsImNsaWVudE5hbWUiOiJ2MHgwdiIsInNjb3BlIjpbImFjY291bnQ6cmVhZCIsImFjY291bnQ6d3JpdGUiLCJ1c2VyOnJlYWQiLCJ1c2VyOndyaXRlIiwiYmlsbGluZzpyZWFkIiwiYmlsbGluZzp3cml0ZSIsImZpbGVzOnJlYWQiLCJmaWxlczp3cml0ZSIsImZpbGVzOmNyZWF0ZSIsImZpbGVzOnVwbG9hZDptdWx0aXBhcnQiLCJ2aWRlb3MiLCJpbWFnZXMiXSwiaWF0IjoxNjA3MzU4MzU4LCJleHAiOjE2MDczNTk1NTgsImF1ZCI6IndxNG1wdjh2dDBzY2o4MDNkaXp1NWF5aW9jMGFsa3AzIn0.13-DeJlcdquf2Hn6avaEYn-jErGYVlfhtbjRnncb3aA';

module.exports = async function() {

  if (!token_str) {
    var token = await sirv.get_token();
    console.log('token', token);
    token_str = token && token.token;
  }

  if (!token_str)
    return;

  /*
  var limits = null;
  try {
    limits = await sirv.get_limit(token_str);
    console.log('limits', limits);
  } catch(ex) {
    console.log(ex);
  }
  
  var x = null;
  try {
    x = await sirv.check_exists('/Welcome to Sirv.jpg', token_str);
    console.log('x', x);
  } catch(ex) {
    console.log(ex);
  }

  var x = null;
  try {
    x = await sirv.decode_content('110c99fd86f2af6aa47e9ed189466d99:1d4eef346cae5141e07ee32bd0e24225d2c25521c6be1c8d554b5ec7022f8a5a');
    console.log('x', x);
  } catch(ex) {
    console.log(ex);
  }

  */
  
  var x = null;
  try {
    x = await sirv.get_file_content('/asiansister/386_0079.json', token_str);
    x = JSON.parse(x);
    console.log('x', x);
  } catch(ex) {
    console.log(ex);
  }
return x;
}
