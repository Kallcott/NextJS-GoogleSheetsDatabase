import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>{sheetdata}</h1>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const req = await fetch("http://localhost:3000/posts/sheet");
  const res = await req.json();

  return {
    props: {
      sheetdata: res.data,
    },
  };
}
