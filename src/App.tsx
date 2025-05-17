import appLogo from '/logo.png';
import { Provider } from './components/ui/provider';
import { Flex, Icon, Image, Link, useDisclosure, Text, Box, Drawer, IconButton, Portal, Group, CloseButton, useBreakpoint, type FlexProps, type UseDisclosureReturn, Container, VStack, AbsoluteCenter } from '@chakra-ui/react'
import { LuArrowRight, LuLayoutTemplate, LuMenu } from 'react-icons/lu'
import { MdHome } from 'react-icons/md';
import type { IconType } from 'react-icons';
import React from 'react';
import { ColorModeButton } from './components/ui/color-mode';

const baseUrl = import.meta.env.BASE_URL;

function NavItem(props: FlexProps & { icon?: IconType, active?: boolean }) {
  const { icon, active, color, children, ...rest } = props;

  return (
    <Flex
      align="center"
      px="4" py="3"
      cursor="button"
      layerStyle={active ? 'nav.active' : undefined}
      color='nav'
      _hover={{
        bg: "gray.100",
        color: "gray.900",
        _dark: {
          bg: "gray.900",
          color: "gray.100"
        },
      }}
      role="group"
      fontWeight="semibold"
      transitionDuration="fast"
      transitionTimingFunction="ease-in-out"
      userSelect="none"
      {...rest}
    >
      {icon && (
        <Icon
          mx="2"
          boxSize="4"
          _groupHover={{
            color: color,
          }}
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
}

function BrandLogo() {
  return (
    <Flex px="4" py="5" align="center" userSelect="none" pointerEvents="none">
      <Image src={appLogo} height="8" />
      <Text
        fontSize="2xl"
        ml="2"
        color="brand"
        fontWeight="semibold"
      >Anki Advanced</Text>
    </Flex>
  );
}

function SidebarContent() {
  return (
    <Flex
      direction="column"
      as="nav"
      fontSize="md"
      color="gray.800"
      aria-label="Main Navigation"
    >
      <NavItem active icon={MdHome}>Home</NavItem>
      <NavItem icon={LuLayoutTemplate}><Link color="nav" href={`${baseUrl}editor-poc.html`}>Card Editor (POC) <LuArrowRight /></Link></NavItem>
    </Flex>
  );
}

function Sidebar(props: { width: string, disclosure: UseDisclosureReturn}) {
  const { width, disclosure } = props;
  return (
    <>
      <Box as="nav"
        pos="fixed" top="0" left="0" zIndex="sticky"
        h="full" overflowX="hidden" overflowY="auto"
        pb="10"
        color="inherit" bg="white"
        _dark={{
          bg: "gray.800",
        }}
        borderRightWidth={{
          base: "0",
          lg: "1px",
        }}
        w={{
          base: 0,
          lg: width,
        }}
        transitionDuration="fast"
        transitionTimingFunction="ease-in-out"
      >
        <Box w={width}>
          <BrandLogo />
          <SidebarContent />
        </Box>
      </Box>
      

      <Drawer.Root placement="start" open={disclosure.open} onOpenChange={(e) => { disclosure.setOpen(e.open); }}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxWidth={width}>
              <Drawer.Header><BrandLogo /></Drawer.Header>
              <Drawer.Body padding="0">
                <SidebarContent />
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}

function Navbar(props: { height: string, sidebarDisclosure: UseDisclosureReturn}) {
  const { height, sidebarDisclosure } = props;
  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      px="4"
      bg="white"
      _dark={{
        bg: "gray.800",
      }}
      borderBottomWidth="1px"
      color="inherit"
      h={height}
    >
      <Flex>
        <Group
          display={{
            base: "inline-flex",
            lg: "none",
          }}
        >
          <IconButton aria-label="Menu" variant="outline" onClick={sidebarDisclosure.onOpen}><LuMenu /></IconButton>
          <BrandLogo />
        </Group>
      </Flex>
      <Flex>
        <ColorModeButton />
      </Flex>
    </Flex>
  );
}

function Dashboard() {
  const navbarHeight = '3.5rem';
  const sidebarWidth = '18rem';
  const sidebarDisclosure = useDisclosure();
  const breakpoint = useBreakpoint({
    getWindow: () => window,
    breakpoints: ['base', 'sm', 'lg'],
  });

  React.useEffect(() => {
    if (breakpoint === 'lg') {
      sidebarDisclosure.onClose();
    }
  }, [breakpoint, sidebarDisclosure]);
  return (
    <Box
      as="section"
      bg="gray.50"
      _dark={{
        bg: "gray.700",
      }}
      minH="100vh"
    >
      
      <Sidebar
        width={sidebarWidth}
        disclosure={sidebarDisclosure}
      />
      
      <Box
        ml={{
          base: 0,
          lg: sidebarWidth,
        }}
        transitionDuration="fast"
        transitionTimingFunction="ease-in-out"
      >
        <Navbar height={navbarHeight} sidebarDisclosure={sidebarDisclosure} />
        <Container as="main" h={`calc(100vh - ${navbarHeight})`} overflow={'auto'}>
          {/* Add content here, remove div below  */}
            <Home />
        </Container>
      </Box>
    </Box>
  );
};

function Home() {
  return (
    <AbsoluteCenter p="4">
      <VStack>
        <Image src={appLogo} opacity={0.25} height="8em" userSelect="none" pointerEvents="none" />
        <Link href={`${baseUrl}editor-poc.html`}>Card Editor (POC) <LuArrowRight /></Link>
      </VStack>
    </AbsoluteCenter>
  );
}

function App() {
  return (
    <Provider>
      <Dashboard />
    </Provider>
  )
}

export default App;
