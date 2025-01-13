var axios = require("axios").default;
var JSONBig = require("json-bigint");

var bigIntValue = -250815064572389897n;

var options = {
  method: 'POST',
  url: 'https://integrate.us.mixtelematics.com/api/trips/groups/createdsince/entitytype/Asset/sincetoken/20250112000000/quantity/1000',
  params: {includeSubTrips: 'true'},
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'insomnia/10.3.0',
    Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjdpNXRielA2YnU5VXhjR0F5MGhPVWZIX3M4SSIsImtpZCI6IjdpNXRielA2YnU5VXhjR0F5MGhPVWZIX3M4SSJ9.eyJpc3MiOiJodHRwczovL2lkZW50aXR5LnVzLm1peHRlbGVtYXRpY3MuY29tL2NvcmUiLCJleHAiOjE3MzY2ODI4NTMsIm5iZiI6MTczNjY3OTI1MywiY2xpZW50X2lkIjoibWl4YnJyYXBvc28iLCJzY29wZSI6WyJNaVguSW50ZWdyYXRlIiwib2ZmbGluZV9hY2Nlc3MiXSwic3ViIjoiLTMxMjgzMDQ4NjcyNjA2NTMzODMiLCJhdXRoX3RpbWUiOjE3MzY2NzkyNTMsImlkcCI6Imlkc3J2IiwiQXV0aFRva2VuIjoiNWE3NDU3YzMtYjQyYy00MDRkLTkzNGMtM2M1YjZhYTU4MGY4IiwianRpIjoiNjQ2YjM5MGFlOGI3NmNhNzBiOTk1OGJkYjE2NDExNTMiLCJhbXIiOlsicGFzc3dvcmQiXX0.VfXz6IgzQf4Xxk3N8vRqKedRafBRb5YJ5RvjZnhO6T2xPBk4ztn2nXxTRZXznVAfwEO5bwo3_B3VBF0qHi7vkw5vA2hVqseVKgYFue-FjWA6QTkJGjy1q7ugOR-ZKCHb6TmtKDleGAlF60FwjyzIsUgkmfyuRimjfomAzf86tTm0pP48gMy-xvzhB2l7Sff3udpXdmWjaX0IVs4SYoRZe7gE7_ZEZ_LCkrzSLCX_huNMD502XNfuWGCbQutPEB-PhsYTE6PaC9du2RGskVeO_tnYdaWtQF3Qjb2CWuFrXJgdSLHzgv1P2VczW5sv2XmJJFL5JQcl015OJMG2UFrFfm4sfE5Qv7zRPY8-mfbqNj6pCEo7SLFCw6MuUALSyM6H9sTZM3VZX-MWMqD1e2KK6zZjAMBCIhPq6IkFLrMYxw3UEc_tziXWJnMgx1R1GC83NX5Rk5a5dfuJd5PJKSDh-XqGk5NY6Thav_Zgaqy8llNVg7EAlPsbeZA1KNHif0-2qJO-OgjoXkfUmzTqfXrenXuWs5Fj5wFPx9KRxZsaVvslKQR1s2zABQ4u-Z3EVjlRqBDwZZldzg20u_d4tB9Qf58-NBwR-fYBWweDtKBwWGpCS3pHVm4BlMTGk5qyoTzNKCZMQQTeGPpv0uyx5qsOKkNTVg5k3H1wSyvd9z7MTzU'
  },
  data: JSONBig.stringify([bigIntValue])
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});
