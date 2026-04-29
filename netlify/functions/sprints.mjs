export default async (req) => {
  const domain = 'weiswise.atlassian.net';
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!email || !token) {
    return Response.json({ error: 'Missing Jira credentials' }, { status: 500 });
  }

  const auth = Buffer.from(email + ':' + token).toString('base64');

  try {
    const response = await fetch('https://' + domain + '/rest/api/3/search/jql', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: 'project = YEL ORDER BY updated DESC',
        fields: ['*all'],
        maxResults: 1
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: 'Jira API error: ' + response.status, detail: text }, { status: 500 });
    }

    const data = await response.json();
    const first = data.issues && data.issues[0];
    const fields = (first && first.fields) ? first.fields : {};

    const sprintSample = {};
    Object.entries(fields).forEach(function(entry) {
      if (JSON.stringify(entry[1]).toLowerCase().includes('sprint')) {
        sprintSample[entry[0]] = entry[1];
      }
    });

    return Response.json({
      key: first && first.key,
      fieldKeys: Object.keys(fields),
      sprintSample: sprintSample
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
