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
        fields: ['parent'],
        maxResults: 500
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return Response.json({ error: 'Jira API error: ' + response.status, detail: text }, { status: 500 });
    }

    const data = await response.json();
    const sprints = {};

    data.issues.forEach(function(issue) {
      const parent = issue.fields && issue.fields.parent;
      if (parent && parent.fields && parent.fields.summary) {
        sprints[issue.key] = parent.fields.summary;
      }
    });

    return Response.json(sprints);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/api/sprints'
};
