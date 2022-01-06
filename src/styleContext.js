import React from 'react'
import { createUseStyles } from 'react-jss'

import { style } from './style';

export const useCustomStyle = (overrideStyle = {}) => {
  const useStyle = createUseStyles({ ...style, ...overrideStyle })
  const classes = useStyle();

  return classes
}