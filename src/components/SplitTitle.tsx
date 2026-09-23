import React from 'react';
import { Text } from 'react-native';

type Props = {
  /** Black text before the red word(s). */
  pre?: string;
  /** The red (highlighted) part of the title. */
  highlight: string;
  /** Black text after the red word(s) — some languages need it. */
  post?: string;
  style?: any;
  highlightStyle?: any;
  /** Put the highlight on its own line, as some screens already do. */
  newLine?: boolean;
};

/**
 * Renders a screen title that is part black and part red, keeping the exact
 * same styling in every language. A language that does not need `pre` or
 * `post` simply leaves it empty and no stray spaces are rendered.
 */
export default function SplitTitle({
  pre,
  highlight,
  post,
  style,
  highlightStyle,
  newLine = false,
}: Props) {
  return (
    <Text style={style}>
      {pre ? (newLine ? `${pre}\n` : `${pre} `) : ''}
      <Text style={highlightStyle}>{highlight}</Text>
      {post ? ` ${post}` : ''}
    </Text>
  );
}
