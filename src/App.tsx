import appLogo from '/logo.png';
import { Provider } from './components/ui/provider';
import { AbsoluteCenter, Heading, Image, Link, VStack } from '@chakra-ui/react'
import { LuArrowRight } from 'react-icons/lu'

function App() {
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <Provider>
      <AbsoluteCenter>
        <VStack>
          <Image src={appLogo} height="10em" />
          <Heading as="h1" size="5xl" letterSpacing="wide">Anki Advanced</Heading>
          <Link href={`${baseUrl}editor-poc.html`}>Card Editor (POC) <LuArrowRight /></Link>
        </VStack>
      </AbsoluteCenter>
    </Provider>
  )
}

export default App;
