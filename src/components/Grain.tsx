import styles from "./Grain.module.scss";

// Film grain: an oversized noise tile jittered in 5 steps. Pure CSS, no JS.
export default function Grain() {
  return <div className={styles.grain} aria-hidden="true" />;
}
