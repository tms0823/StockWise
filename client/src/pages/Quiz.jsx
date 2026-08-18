import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../services/learningService';

const styles = {
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  heading: {
    marginBottom: '4px',
  },
  subheading: {
    marginTop: 0,
    marginBottom: '24px',
    color: '#555',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  questionText: {
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: '12px',
  },
  option: {
    display: 'block',
    padding: '8px 0',
    cursor: 'pointer',
  },
  radio: {
    marginRight: '8px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  buttonEnabled: {
    backgroundColor: '#1a73e8',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#c7c7c7',
    color: '#666',
    cursor: 'not-allowed',
  },
  hint: {
    color: '#666',
    fontSize: '0.9rem',
    marginTop: '8px',
  },
  errorBox: {
    border: '1px solid #e0b4b4',
    backgroundColor: '#fff6f6',
    color: '#9f3a38',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
  },
  scoreBox: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    backgroundColor: '#f7f9fc',
  },
  scoreValue: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    margin: '4px 0',
  },
  resultCorrect: {
    border: '1px solid #a3d9a5',
    backgroundColor: '#f4fbf4',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  resultIncorrect: {
    border: '1px solid #e0b4b4',
    backgroundColor: '#fdf6f6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  verdict: {
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  answerLine: {
    margin: '4px 0',
  },
  explanation: {
    margin: '8px 0 0 0',
    color: '#444',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: '24px',
  },
  link: {
    color: '#1a73e8',
  },
};

const readError = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

function Quiz() {
  // React Router decodes the param, so this is the original topic string.
  const { topic } = useParams();

  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map of question id -> selected option index.
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      setQuestions(null);
      setSelections({});
      setResult(null);
      setSubmitError(null);

      try {
        const response = await getQuiz(topic);
        if (!cancelled) {
          setQuestions(response.data.data.questions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(readError(err, 'Something went wrong'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchQuiz();

    return () => {
      cancelled = true;
    };
  }, [topic]);

  const handleSelect = (questionId, optionIndex) => {
    setSelections((previous) => ({ ...previous, [questionId]: optionIndex }));
  };

  const answeredCount = questions
    ? questions.filter((question) => selections[question._id] !== undefined).length
    : 0;
  const allAnswered = questions ? answeredCount === questions.length : false;

  const handleSubmit = async () => {
    if (!allAnswered || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const answers = questions.map((question) => ({
      questionId: question._id,
      selectedIndex: selections[question._id],
    }));

    try {
      const response = await submitQuiz(topic, answers);
      setResult(response.data.data);
    } catch (err) {
      setSubmitError(readError(err, 'Could not submit your answers'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelections({});
    setResult(null);
    setSubmitError(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Quiz</h1>
      <h2 style={styles.subheading}>{topic}</h2>

      {loading && <p>Loading quiz...</p>}

      {error && (
        <div style={styles.errorBox}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Graded view — replaces the form once the server returns a score. */}
      {result && (
        <div>
          <div style={styles.scoreBox}>
            <p style={{ margin: 0 }}>Your score</p>
            <p style={styles.scoreValue}>
              {result.score} / {result.total}
            </p>
            <p style={{ margin: 0 }}>
              {result.score === result.total
                ? 'Perfect score — every answer was correct.'
                : 'Review the explanations below to see what to revisit.'}
            </p>
          </div>

          {result.results.map((item, index) => (
            <div
              key={item.questionId}
              style={item.isCorrect ? styles.resultCorrect : styles.resultIncorrect}
            >
              <p style={styles.verdict}>
                {index + 1}. {item.isCorrect ? 'Correct' : 'Incorrect'}
              </p>
              <p style={styles.answerLine}>{item.question}</p>
              <p style={styles.answerLine}>
                Your answer: {questionOptionText(questions, item, item.selectedIndex)}
              </p>
              {!item.isCorrect && (
                <p style={styles.answerLine}>
                  Correct answer:{' '}
                  {questionOptionText(questions, item, item.correctOptionIndex)}
                </p>
              )}
              {item.explanation && (
                <p style={styles.explanation}>{item.explanation}</p>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleRetake}
            style={{ ...styles.button, ...styles.buttonEnabled }}
          >
            Retake quiz
          </button>
        </div>
      )}

      {/* Answer form — hidden once a result is showing. */}
      {!loading && !error && !result && questions && (
        <div>
          {questions.map((question, index) => (
            <div key={question._id} style={styles.card}>
              <p style={styles.questionText}>
                {index + 1}. {question.question}
              </p>
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} style={styles.option}>
                  <input
                    type="radio"
                    name={question._id}
                    value={optionIndex}
                    checked={selections[question._id] === optionIndex}
                    onChange={() => handleSelect(question._id, optionIndex)}
                    style={styles.radio}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}

          {submitError && (
            <div style={styles.errorBox}>
              <p style={{ margin: 0 }}>{submitError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            style={{
              ...styles.button,
              ...(allAnswered && !submitting
                ? styles.buttonEnabled
                : styles.buttonDisabled),
            }}
          >
            {submitting ? 'Submitting...' : 'Submit answers'}
          </button>

          {!allAnswered && (
            <p style={styles.hint}>
              Answer all {questions.length} questions to submit ({answeredCount}{' '}
              answered).
            </p>
          )}
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

/**
 * Option text for a graded result. The submitted questions carry the options,
 * so they are looked up by id rather than repeated in the grading response.
 */
function questionOptionText(questions, item, optionIndex) {
  const question = (questions || []).find((entry) => entry._id === item.questionId);

  if (!question || optionIndex === undefined || !question.options[optionIndex]) {
    return 'No answer';
  }

  return question.options[optionIndex];
}

export default Quiz;
