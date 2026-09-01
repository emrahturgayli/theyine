"use client";

import Link from "next/link";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import styles from "../styles/blokmate.module.css";

/**
 * Full-width blog listing, deliberately styled apart from the rest of
 * /blokmate (see styles/blokmate.module.css) — no Navbar/Footer chrome,
 * no container-shell max-width; it's meant to read as its own editorial
 * space, not another landing-page section.
 */
export default function BlokmateBlogPage() {
  const { dict } = useBlokmateLanguage();
  const blog = dict.blog;

  return (
    <div className={styles.blogPage}>
      <header className={styles.blogHeader}>
        <span className={styles.blogEyebrow}>BlokMate</span>
        <h1 className={styles.blogTitle}>{blog.title}</h1>
        <p className={styles.blogSubtitle}>{blog.subtitle}</p>
        <Link href="/blokmate" className={styles.backLink}>
          ← {blog.backToHome}
        </Link>
      </header>

      <div className={styles.blogGrid}>
        {blog.posts.map((post) => (
          <Link key={post.slug} href={`/blokmate/blog/${post.slug}`} className={styles.postCard}>
            <div className={styles.postDate}>{post.date}</div>
            <h2 className={styles.postTitle}>{post.title}</h2>
            <p className={styles.postExcerpt}>{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
