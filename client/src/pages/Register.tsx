import React from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  VStack, 
  FormErrorMessage,
  Text,
  Link,
  useToast
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const toast = useToast();

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await register(values.name, values.email, values.password);
        toast({
          title: 'Registration successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Registration error:', error);
        toast({
          title: 'Registration failed',
          description: 'An error occurred during registration',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box p={8} maxWidth="400px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack spacing={4} align="flex-start" w="full">
          <Heading>Register</Heading>
          
          <form onSubmit={formik.handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4} align="flex-start" w="full">
              <FormControl isInvalid={!!formik.errors.name && formik.touched.name}>
                <FormLabel htmlFor="name">Name</FormLabel>
                <Input
                  id="name"
                  type="text"
                  {...formik.getFieldProps('name')}
                />
                <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!formik.errors.email && formik.touched.email}>
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  {...formik.getFieldProps('email')}
                />
                <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!formik.errors.password && formik.touched.password}>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input
                  id="password"
                  type="password"
                  {...formik.getFieldProps('password')}
                />
                <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!formik.errors.confirmPassword && formik.touched.confirmPassword}>
                <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...formik.getFieldProps('confirmPassword')}
                />
                <FormErrorMessage>{formik.errors.confirmPassword}</FormErrorMessage>
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={formik.isSubmitting}
              >
                Register
              </Button>
            </VStack>
          </form>
          
          <Text w="full" textAlign="center">
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="blue.500">
              Login
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Register;
