import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getLearningProgress } from '../services/learningService';

const styles = {
  container: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  heading: {
    marginBottom: '4px',
  },
  intro: {
    marginTop: 0,
    marginBottom: '24px',
    color: '#555',
  },
  tileRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px',
  },
  tile: {
    flex: '1 1 180px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f7f9fc',
  },
  tileLabel: {
    margin: 0,
    color: '#555',
    fontSize: '0.9rem',
  },
  tileValue: {
    margin: '4px 0 0 0',
    fontSize: '1.6rem',
    fontWeight: 'bold',
  },
  continueBox: {
    border: '1px solid #b8d4f5',
    backgroundColor: '#f2f8ff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  sectionHeading: {
    marginBottom: '12px',
  },
  row: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
  },
  rowMain: {
    flex: '1 1 260px',
  },
  topicName: {
    margin: 0,
    fontWeight: 'bold',
  },
  rowMeta: {
    margin: '4px 0 0 0',
    color: '#666',
    fontSize: '0.9rem',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    marginLeft: '8px',
  },
  badgeDone: {
    backgroundColor: '#e3f5e3',
    color: '#2b6a2b',
    border: '1px solid #a3d9a5',
  },
  badgeNew: {
    backgroundColor: '#f0f0f0',
    color: '#555',
    border: '1px solid #ddd',
  },
  errorBox: {
    border: '1px solid #e0b4b4',
    backgroundColor: '#fff6f6',
    color: '#9f3a38',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
  },
  link: {
    color: '#1a73e8',
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
};

const percent = (score, total) => (total > 0 ? Math.round((score / total) * 100) : 0);

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

/**
 * Collapse a user's attempts into one summary per topic: how many times they
 * took it, their best result, and when they last tried.
 */
const summarizeAttempts = (attempts) => {
  const byTopic = new Map();

  for (const attempt of attempts) {
    const existing = byTopic.get(attempt.topic);
    const attemptPercent = percent(attempt.score, attempt.totalQuestions);

    if (!existing) {
      byTopic.set(attempt.topic, {
        count: 1,
        bestPercent: attemptPercent,
        bestScore: attempt.score,
        bestTotal: attempt.totalQuestions,
        lastAttemptAt: attempt.completedAt,
      });
      continue;
    }

    existing.count += 1;

    if (attemptPercent > existing.bestPercent) {
      existing.bestPercent = attemptPercent;
      existing.bestScore = attempt.score;
      existing.bestTotal = attempt.totalQuestions;
    }

    // Attempts arrive in insertion order, but compare anyway so the newest wins.
    if (new Date(attempt.completedAt) >= new Date(existing.lastAttemptAt)) {
      existing.lastAttemptAt = attempt.completedAt;
    }
  }

  return byTopic;
};

function LearningDashboard() {
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cue cards supply the full topic list and its display order; progress
        // supplies what this user has done with it.
        const [cardsResponse, progressResponse] = await Promise.all([
          api.get('/cue-cards'),
          getLearningProgress(),
        ]);

        if (!cancelled) {
          setTopics(cardsResponse.data.data);
          setProgress(progressResponse.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || err.message || 'Something went wrong'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  const completedCards = (progress && progress.completedCueCards) || [];
  const attempts = (progress && progress.quizAttempts) || [];
  const attemptsByTopic = summarizeAttempts(attempts);

  const quizzedCount = topics.filter((card) => attemptsByTopic.has(card.topic)).length;
  const completedCount = topics.filter((card) =>
    completedCards.includes(card.topic)
  ).length;

  const bestPercents = topics
    .map((card) => attemptsByTopic.get(card.topic))
    .filter(Boolean)
    .map((summary) => summary.bestPercent);
  const averageBest = bestPercents.length
    ? Math.round(bestPercents.reduce((sum, value) => sum + value, 0) / bestPercents.length)
    : null;

  // Where to pick back up: the first topic in display order with no attempt yet.
  const nextTopic = topics.find((card) => !attemptsByTopic.has(card.topic));

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Your Learning Progress</h1>
      <p style={styles.intro}>
        Track the cue card topics you have studied and how you scored on each quiz.
      </p>

      {loading && <p>Loading your progress...</p>}

      {error && (
        <div style={styles.errorBox}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <div style={styles.tileRow}>
            <div style={styles.tile}>
              <p style={styles.tileLabel}>Topics quizzed</p>
              <p style={styles.tileValue}>
                {quizzedCount} / {topics.length}
              </p>
            </div>
            <div style={styles.tile}>
              <p style={styles.tileLabel}>Cards marked complete</p>
              <p style={styles.tileValue}>
                {completedCount} / {topics.length}
              </p>
            </div>
            <div style={styles.tile}>
              <p style={styles.tileLabel}>Average best score</p>
              <p style={styles.tileValue}>
                {averageBest === null ? '—' : `${averageBest}%`}
              </p>
            </div>
            <div style={styles.tile}>
              <p style={styles.tileLabel}>Quizzes taken</p>
              <p style={styles.tileValue}>{attempts.length}</p>
            </div>
          </div>

          <div style={styles.continueBox}>
            {nextTopic ? (
              <div>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>Continue where you left off</strong>
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  Next up: <strong>{nextTopic.topic}</strong>
                </p>
                <Link
                  to={`/quiz/${encodeURIComponent(nextTopic.topic)}`}
                  style={styles.link}
                >
                  Take the {nextTopic.topic} quiz
                </Link>
              </div>
            ) : (
              <p style={{ margin: 0 }}>
                <strong>You have taken a quiz on every topic.</strong> Revisit any
                topic below to improve your best score.
              </p>
            )}
          </div>

          <h2 style={styles.sectionHeading}>All topics</h2>

          {topics.length === 0 && (
            <p>
              No cue cards are available yet, so there is nothing to track.{' '}
              <Link to="/learn/cue-cards" style={styles.link}>
                Browse cue cards
              </Link>
            </p>
          )}

          {topics.map((card) => {
            const summary = attemptsByTopic.get(card.topic);
            const isComplete = completedCards.includes(card.topic);
            const lastAttempt = summary ? formatDate(summary.lastAttemptAt) : null;

            return (
              <div style={styles.row} key={card.topic}>
                <div style={styles.rowMain}>
                  <p style={styles.topicName}>
                    {card.topic}
                    <span
                      style={{
                        ...styles.badge,
                        ...(summary ? styles.badgeDone : styles.badgeNew),
                      }}
                    >
                      {summary ? 'Quiz taken' : 'Not started'}
                    </span>
                    {isComplete && (
                      <span style={{ ...styles.badge, ...styles.badgeDone }}>
                        Card read
                      </span>
                    )}
                  </p>
                  <p style={styles.rowMeta}>
                    {summary
                      ? `Best ${summary.bestScore}/${summary.bestTotal} (${summary.bestPercent}%) · ${summary.count} attempt${summary.count === 1 ? '' : 's'}${lastAttempt ? ` · last ${lastAttempt}` : ''}`
                      : 'No quiz attempts yet'}
                  </p>
                </div>
                <Link
                  to={`/quiz/${encodeURIComponent(card.topic)}`}
                  style={styles.link}
                >
                  {summary ? 'Retake quiz' : 'Start quiz'}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.footer}>
        <Link to="/learn/cue-cards" style={styles.link}>
          Back to cue cards
        </Link>
      </div>
    </div>
  );
}

export default LearningDashboard;
