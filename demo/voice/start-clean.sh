#!/bin/bash
# Start the voice app while filtering out mpg123 buffer underflow warnings
npm run dev 2>&1 | grep -v "warning: Didn't have any audio data in callback" 