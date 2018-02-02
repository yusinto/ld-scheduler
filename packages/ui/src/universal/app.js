import React from 'react';
import styles from './app.css';

export default () =>
  <div className={styles.root}>
    <aside className={styles.leftNav}>
      Welcome
    </aside>
    <div className={styles.content}>
      <div className={styles.contentHeader}>
        <h1>Dashboard</h1>
      </div>
      <section className={styles.contentBody}>
        Your feature flags
      </section>
    </div>
  </div>;
