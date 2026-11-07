import { Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { useTutorColors } from './tutor-colors';

interface MarkdownTextProps {
  text: string;
  color: string;
}

type Block =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string; marker: string }
  | { type: 'code'; text: string }
  | { type: 'paragraph'; text: string };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.split('\n');
  let paragraph: string[] = [];
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (code) {
        blocks.push({ type: 'code', text: code.join('\n') });
        code = null;
      } else {
        flushParagraph();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', text: heading[1] });
      continue;
    }

    const bullet = trimmed.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      const marker = /\d/.test(bullet[1]) ? bullet[1].replace(')', '.') : '•';
      blocks.push({ type: 'bullet', text: bullet[2], marker });
      continue;
    }

    paragraph.push(trimmed);
  }

  // Unterminated code block while streaming: render what we have.
  if (code) blocks.push({ type: 'code', text: code.join('\n') });
  flushParagraph();
  return blocks;
}

function renderInline(text: string, codeStyle: TextStyle): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={index} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text key={index} style={codeStyle}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

/** Lightweight markdown renderer for tutor replies (no extra dependency). */
export function MarkdownText({ text, color }: MarkdownTextProps) {
  const colors = useTutorColors();
  const blocks = parseBlocks(text);
  const inlineCode: TextStyle = {
    ...styles.inlineCode,
    backgroundColor: colors.codeBackground,
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <Text key={index} selectable style={[styles.heading, { color }]}>
                {renderInline(block.text, inlineCode)}
              </Text>
            );
          case 'bullet':
            return (
              <View key={index} style={styles.bulletRow}>
                <Text style={[styles.body, styles.bulletMarker, { color }]}>{block.marker}</Text>
                <Text selectable style={[styles.body, styles.bulletText, { color }]}>
                  {renderInline(block.text, inlineCode)}
                </Text>
              </View>
            );
          case 'code':
            return (
              <View
                key={index}
                style={[styles.codeBlock, { backgroundColor: colors.codeBackground }]}>
                <Text selectable style={[styles.codeText, { color }]}>
                  {block.text}
                </Text>
              </View>
            );
          default:
            return (
              <Text key={index} selectable style={[styles.body, { color }]}>
                {renderInline(block.text, inlineCode)}
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
  },
  heading: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 2,
  },
  bulletMarker: {
    minWidth: 14,
    fontWeight: '600',
  },
  bulletText: {
    flex: 1,
  },
  inlineCode: {
    fontFamily: 'Menlo',
    fontSize: 14,
    borderRadius: 4,
  },
  codeBlock: {
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 12,
  },
  codeText: {
    fontFamily: 'Menlo',
    fontSize: 13,
    lineHeight: 19,
  },
});
