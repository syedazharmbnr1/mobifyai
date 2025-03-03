import React from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      padding={4}
    >
      <Heading size="2xl" mb={4}>
        404
      </Heading>
      <Heading size="xl" mb={6}>
        Page Not Found
      </Heading>
      <Text fontSize="lg" mb={8}>
        The page you are looking for does not exist.
      </Text>
      <Button as={RouterLink} to="/" colorScheme="blue">
        Go to Home
      </Button>
    </Box>
  );
};

export default NotFound;
