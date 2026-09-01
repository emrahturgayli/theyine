"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useBlokmateLanguage } from "@/hooks/useBlokmateLanguage";
import styles from "../../styles/blokmate.module.css";

/**
 * Post detail — full text isn't written yet (no CMS wired up), so this
 * shows the post's title/date/excerpt as a placeholder rather than
 * fabricating article body copy. Swap in real content (or a CMS fetch)
 * before linking these posts anywhere outside the listing.
 */
export default function BlokmateBlogPostPage() {
  const { dict } = useBlokmateLanguage();
  const params = useParams<{ slug: string }>();
  const post = dict.blog.posts.find((p) => p.slug === params.slug);

  if (!post) notFound();

  return (
    <div className={styles.blogPage}>
      <header className={styles.blogHeader}>
        <span className={styles.blogEyebrow}>BlokMate</span>
        <h1 className={styles.blogTitle}>{post.title}</h1>
        <p className={styles.blogSubtitle}>{post.excerpt}</p>
        <Link href="/blokmate/blog" className={styles.backLink}>
          ← {dict.blog.backToHome}
        </Link>
      </header>
      <div className={styles.blogGrid} style={{ gridTemplateColumns: "1fr" }}>
        <p className={styles.postExcerpt} style={{ maxWidth: "42rem", margin: "0 auto", fontSize: "1rem" }}>
          {post.date} — Tam yazı yakında.
        </p>
      </div>
    </div>
  );
}
