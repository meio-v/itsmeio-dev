"use client";

import Link from "next/link";

import styles from "./mall.module.css";

export default function MallError({ reset }: { reset(): void }) {
  return (
    <main className={styles.page}>
      <section className={styles.routeError}>
        <p className={styles.kicker}>Mall wing / closed for maintenance</p>
        <h1>The shutters came down.</h1>
        <p>
          The alternate entrance hit an unexpected error. Nothing else on the
          site is affected.
        </p>
        <div className={styles.rideActions}>
          <button className={styles.primaryButton} type="button" onClick={reset}>
            Try again
          </button>
          <Link className={styles.secondaryButton} href="/">
            Main site
          </Link>
        </div>
      </section>
    </main>
  );
}
