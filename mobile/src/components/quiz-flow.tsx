import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { LiquidGlassCard } from '@/components/liquid-glass';
import { type CourseQuiz } from '@/data/courses';

interface QuizFlowProps {
  quiz: CourseQuiz;
  courseName: string;
  onComplete: (correctCount: number, totalCount: number) => void;
  onCancel: () => void;
}

export function QuizFlow({
  quiz,
  courseName,
  onComplete,
  onCancel,
}: QuizFlowProps) {
  const isDark = useColorScheme() === 'dark';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const textPrimary = isDark ? '#F5F7FA' : '#0F172A';
  const textSecondary = isDark
    ? 'rgba(235, 235, 245, 0.62)'
    : 'rgba(15, 23, 42, 0.58)';
  const accentColor = isDark ? '#38BDF8' : '#007AFF';
  const borderNeutral = isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(15, 23, 42, 0.10)';

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentIndex];
  const progressFraction =
    totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 1;

  const handleSelectOption = (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);
    if (optionIndex === currentQuestion.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => onComplete(correctCount, totalQuestions)}>
            <Text style={[styles.backLink, { color: accentColor }]}>
              ‹ Back to Course
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={styles.summaryScroll}>
          <LiquidGlassCard style={styles.summaryCard}>
            <Text style={[styles.summaryOverline, { color: accentColor }]}>
              QUIZ COMPLETED · {courseName.toUpperCase()}
            </Text>
            <Text style={[styles.summaryTitle, { color: textPrimary }]}>
              {quiz.topic}
            </Text>

            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreBig, { color: textPrimary }]}>
                {correctCount}/{totalQuestions}
              </Text>
              <Text style={[styles.scorePercent, { color: textSecondary }]}>
                {percentage}% Accuracy
              </Text>
            </View>

            <Text style={[styles.summaryMessage, { color: textSecondary }]}>
              {percentage >= 75
                ? 'Strong performance! Your course AI Score has been updated.'
                : 'Good practice run. Reviewing the explanations will boost your AI Score.'}
            </Text>

            <Pressable
              onPress={() => onComplete(correctCount, totalQuestions)}
              style={[
                styles.primaryButton,
                styles.fullWidthButton,
                { backgroundColor: accentColor },
              ]}>
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: isDark ? '#0B0F17' : '#FFFFFF' },
                ]}>
                Save & Return to Course
              </Text>
            </Pressable>
          </LiquidGlassCard>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onCancel} style={styles.backPressable}>
          <Text style={[styles.backLink, { color: accentColor }]}>
            ‹ Exit Quiz
          </Text>
        </Pressable>
        <Text style={[styles.stepCounter, { color: textSecondary }]}>
          Question {currentIndex + 1} of {totalQuestions}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrackWrapper}>
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(15, 23, 42, 0.08)',
            },
          ]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressFraction * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LiquidGlassCard style={styles.questionCard}>
          <Text style={[styles.topicLabel, { color: accentColor }]}>
            {quiz.topic}
          </Text>
          <Text style={[styles.promptText, { color: textPrimary }]}>
            {currentQuestion.prompt}
          </Text>

          <View style={styles.optionsList}>
            {currentQuestion.options.map((option, idx) => {
              const isAnswered = selectedOption !== null;
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctIndex;

              let borderColor = borderNeutral;
              let optionBg = isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.55)';
              let optionTextColor = textPrimary;

              if (isAnswered) {
                if (isCorrect) {
                  borderColor = '#10B981';
                  optionBg = isDark
                    ? 'rgba(16, 185, 129, 0.20)'
                    : 'rgba(16, 185, 129, 0.14)';
                  optionTextColor = isDark ? '#6EE7B7' : '#065F46';
                } else if (isSelected && !isCorrect) {
                  borderColor = '#EF4444';
                  optionBg = isDark
                    ? 'rgba(239, 68, 68, 0.20)'
                    : 'rgba(239, 68, 68, 0.12)';
                  optionTextColor = isDark ? '#FCA5A5' : '#991B1B';
                }
              }

              return (
                <Pressable
                  key={`${currentQuestion.id}-opt-${idx}`}
                  disabled={isAnswered}
                  onPress={() => handleSelectOption(idx)}
                  style={[
                    styles.optionButton,
                    {
                      borderColor,
                      backgroundColor: optionBg,
                    },
                  ]}>
                  <View
                    style={[
                      styles.optionLetterCircle,
                      {
                        borderColor,
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.85)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.optionLetterText,
                        { color: optionTextColor },
                      ]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.optionText, { color: optionTextColor }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedOption !== null && (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor:
                    selectedOption === currentQuestion.correctIndex
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.16)'
                        : 'rgba(16, 185, 129, 0.10)'
                      : isDark
                        ? 'rgba(239, 68, 68, 0.16)'
                        : 'rgba(239, 68, 68, 0.08)',
                },
              ]}>
              <Text
                style={[
                  styles.feedbackHeadline,
                  {
                    color:
                      selectedOption === currentQuestion.correctIndex
                        ? isDark
                          ? '#34D399'
                          : '#15803D'
                        : isDark
                          ? '#F87171'
                          : '#DC2626',
                  },
                ]}>
                {selectedOption === currentQuestion.correctIndex
                  ? '✓ Correct'
                  : '✕ Not quite right'}
              </Text>
              <Text style={[styles.feedbackBody, { color: textSecondary }]}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}
        </LiquidGlassCard>

        {selectedOption !== null && (
          <Pressable
            onPress={handleNext}
            style={[styles.primaryButton, { backgroundColor: accentColor }]}>
            <Text
              style={[
                styles.primaryButtonText,
                { color: isDark ? '#0B0F17' : '#FFFFFF' },
              ]}>
              {currentIndex + 1 < totalQuestions
                ? 'Next Question'
                : 'View Results'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backPressable: {
    paddingVertical: 4,
  },
  backLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrackWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 18,
  },
  questionCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  promptText: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  optionsList: {
    gap: 10,
    marginTop: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 12,
  },
  optionLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  feedbackBox: {
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 14,
    gap: 4,
  },
  feedbackHeadline: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  summaryOverline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCircle: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  scoreBig: {
    fontSize: 44,
    fontWeight: '700',
  },
  scorePercent: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
});
