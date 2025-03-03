import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SvgComponent = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="#e8eaed"
    viewBox="0 -960 960 960"
    {...props}
  >
    <Path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
  </Svg>
);
export default SvgComponent;
