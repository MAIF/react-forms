import debounce from "lodash.debounce";
import React, { useCallback } from "react";
import { Control, useWatch } from "react-hook-form";

import { useHashEffect } from "../utils";
import { cleanOutputArray } from "./formUtils";
import { Schema, Option } from "./types";

export const Watcher = React.memo(({ options, control, schema, onSubmit, handleSubmit }: { options?: Option, control: Control<any, any> | undefined, schema: Schema, onSubmit: (param: any) => void, handleSubmit: ((func: (param: any) => void) => (() => void)) }) => {
  const data = useWatch({ control })

  const realSubmit = (d: any) => handleSubmit(() => {
    onSubmit(d);
  })()

  const debouncedSubmit = useCallback(debounce(realSubmit, 250, { leading: true }), [])

  useHashEffect(() => {
    if (options?.autosubmit) {
      debouncedSubmit(data)
    }
  }, [data])

  if (options?.watch) {
    if (typeof options.watch === 'function') {
      options.watch(cleanOutputArray(data, schema))
    } else {
      console.group('react-form watch')
      console.log(cleanOutputArray(data, schema))
      console.groupEnd()
    }
  }

  return null
}, () => {
  return true
})
