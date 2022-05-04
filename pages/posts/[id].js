import { google } from "googleapis";

// Our server side code. NextJS code
// This will fetch properties, run only on server
export async function getServerSideProps({ query }) {
  // Auth
  const auth = await google.auth.getClient({
    scope: ["https:/www.googleapis.com/auth/spreadsheets.readonly"],
  });
  console.log("good to go!");

  const sheets = google.sheets({ version: "v4", auth });
  console.log(sheets);

  // Query
  const { id } = query;
  const range = `Sheet1!A${id}:C${id}`;
  console.log(range);

  const responce = await sheets.spreadsheets.values.get({
    spreadsheetID: process.env.SHEET_ID,
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
