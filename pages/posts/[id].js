import { google } from "googleapis";
// import { flushSync } from "react-dom/cjs/react-dom.production.min";

// Our server side code. NextJS code
// This will fetch properties, run only on server
export async function getServerSideProps({ query }) {
  // Auth
  const auth = await google.auth.getClient({
    scope: ["https:/www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Query
  const { id } = query;
  const range = `Sheet1!A${id}:B${id}`;
  console.log(range);

  const responce = await sheets.spreadsheets.values.get({
    spreadsheetId: "1MSyG3Wm8-hwCkJdK31-LKs5NTGLPqxtK35nH--hzzu8",
    range,
  });

  // Result
  const [title, content] = responce.data.values[[0]];
  console.log(title);
  console.log(content);

  // sets up props
  return {
    props: {
      title,
      content,
    },
  };
}

// this is client side code
// sets up content for a given row from the server
export default function Post({ title, content }) {
  return (
    <article>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
    </article>
  );
}
