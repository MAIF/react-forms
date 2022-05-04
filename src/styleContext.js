import React from 'react'
import { createUseStyles } from 'react-jss'
import { style } from './style';

export const useCustomStyle = (overrideStyle = {}) => {
  const useStyle = createUseStyles({ ...style, ...overrideStyle })
  const classes = useStyle();
  return classes
}

export const Style = ({ style = {}, children, ...props }) => {
  const classes = useCustomStyle(style)
  return React.cloneElement(children, { classes, ...props })
}