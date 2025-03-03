import React from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  IconButton, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  Avatar,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Box as="nav" bg="white" boxShadow="sm" px={4} py={2}>
      <Flex justify="space-between" align="center">
        <Heading size="md">MobifyAI</Heading>
        
        <HStack spacing={4}>
          <Menu>
            <MenuButton
              as={IconButton}
              variant="ghost"
              icon={<Avatar size="sm" name={user?.name || user?.email} />}
            />
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
