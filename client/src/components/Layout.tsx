import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Box flex="1" p={4} overflowY="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;
