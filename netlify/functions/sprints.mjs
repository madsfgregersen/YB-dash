export default async (req) => {
  const domain = 'weiswise.atlassian.net';
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!email || !token) {
    return Response.json({ error: 'Missing Jira credentials' }, { status: 500 });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const jql = encodeURIComponent('project = YEL AND  ORDER BY updated DESC');
  const url = `https://${domain}/rest/api/3/search?jql=${jql}&fields=customfield_10020&maxResults=500`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return Response.json({ error: `Jira API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const sprints = {};

    for (const issue of data.issues) {
      const sprintField = issue.fields.customfield_10020;
      if (sprintField && sprintField.length > 0) {
        // Prefer active sprint, fall back to most recent
        const sprint = sprintField.find(s => s.state === 'active') || sprintField[sprintField.length - 1];
        sprints[issue.key] = sprint.name;
      }
    }

    return Response.json(sprints);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/api/sprints'
};
