import React from 'react';
import { Box, VStack, Icon, Text, Flex } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface NavItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
  to: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, children, to }) => (
  <Flex
    as={RouterLink}
    to={to}
    align="center"
    p="4"
    mx="4"
    borderRadius="lg"
    role="group"
    cursor="pointer"
    _hover={{
      bg: 'brand.400',
      color: 'white',
    }}
  >
    <Icon
      mr="4"
      fontSize="16"
      as={icon}
    />
    {children}
  </Flex>
);

const Sidebar: React.FC = () => {
  // Placeholder icon component
  const PlaceholderIcon = () => <Box w="4" h="4" bg="gray.400" borderRadius="full" />;

  return (
    <Box
      bg="white"
      w="60"
      h="full"
      borderRight="1px"
      borderRightColor="gray.200"
    >
      <VStack align="stretch" spacing={1} pt={5}>
        <NavItem icon={PlaceholderIcon} to="/">
          <Text>Dashboard</Text>
        </NavItem>
        <NavItem icon={PlaceholderIcon} to="/projects">
          <Text>Projects</Text>
        </NavItem>
        <NavItem icon={PlaceholderIcon} to="/templates">
          <Text>Templates</Text>
        </NavItem>
        <NavItem icon={PlaceholderIcon} to="/settings">
          <Text>Settings</Text>
        </NavItem>
      </VStack>
    </Box>
  );
};

export default Sidebar;
