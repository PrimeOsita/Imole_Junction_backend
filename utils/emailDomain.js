const dns = require('dns').promises;

// Does this email's domain have a mail server? Catches made-up domains such as
// ada@notarealdomain.xyz before we send an email that would only bounce.
// DNS timeouts and other lookup problems let the email through, so a DNS hiccup
// never blocks a real parent.
async function domainCanReceiveEmail(email) {
  const domain = email.split('@')[1];

  try {
    const records = await dns.resolveMx(domain);

    // A single "0 ." record is a "null MX" (RFC 7505): the domain says it never accepts
    // email. example.com publishes one. Node may report that record's host as '' or '.'.
    const realServers = records.filter((record) => record.exchange && record.exchange !== '.');
    return realServers.length > 0;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return false;
    return true;
  }
}
console.log('Email domain utility loaded successfully');
module.exports = { domainCanReceiveEmail };