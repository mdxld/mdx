import React from 'react';
import { Text } from 'ink';

export default function SimpleExample({ name, os, memory, region }) {
  return (
    <Text>
      Deploying "{name}" ({os}) with {memory}MB in {region}...
    </Text>
  );
}
