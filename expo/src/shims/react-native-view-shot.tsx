import React from "react";
import { View } from "react-native";

export type CaptureOptions = {
  format?: string;
  quality?: number;
  result?: string;
};

export type ViewShotProps = React.ComponentProps<typeof View> & {
  options?: CaptureOptions;
};

export default class ViewShot extends React.Component<ViewShotProps> {
  capture(_options?: CaptureOptions): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  render() {
    const { children, ...rest } = this.props;
    return <View {...rest}>{children}</View>;
  }
}
