import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="#5f6368"
    viewBox="0 -960 960 960"
    {...props}
  >
    <Path d="m280-336 128-184H294l80-280H160v320h120v144ZM200-80v-320H80v-480h400l-80 280h160L200-80Zm80-400H160h120Zm305-40 135-360h64l137 360h-62l-32-92H679l-32 92h-62Zm112-144h110l-53-150h-2l-55 150Z" />
  </Svg>
)
export default SvgComponent
