import Link from "next/link";

import { MallPoster } from "./_components/MallPoster";
import styles from "./mall.module.css";

export default function MallLoading() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">
          ITSMEIO.DEV
        </Link>
        <nav aria-label="Site">
          <Link href="/">Main site</Link>
        </nav>
      </header>
      <section className={styles.loadingShell} aria-busy="true">
        <div>
          <p className={styles.kicker}>Mall wing / after hours</p>
          <h1>Opening the shutters.</h1>
          <p>The main site is already available if you would rather skip it.</p>
        </div>
        <MallPoster />
      </section>
    </main>
  );
}
