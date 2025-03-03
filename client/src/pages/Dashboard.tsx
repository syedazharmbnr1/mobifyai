import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Input, 
  Textarea,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  Stack,
  FormControl,
  FormLabel,
  Divider,
  Grid,
  GridItem,
  Image,
  Badge,
  Progress,
  Tag,
  TagLabel,
  useToast
} from '@/components/ui';
import { useQuery } from 'react-query';
import { getProjects } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// AI models available in the platform
const AI_MODELS = [
  { id: 'openai-gpt4', name: 'OpenAI GPT-4', type: 'Commercial', badge: 'Popular' },
  { id: 'anthropic-claude3', name: 'Anthropic Claude 3', type: 'Commercial', badge: 'Recommended' },
  { id: 'google-gemini', name: 'Google Gemini Pro', type: 'Commercial' },
  { id: 'cohere-command', name: 'Cohere Command', type: 'Commercial' },
  { id: 'llama3-70b', name: 'Llama 3 (70B)', type: 'Open Source' },
  { id: 'mistral-large', name: 'Mistral Large', type: 'Open Source' },
]

// Mobile app templates
const APP_TEMPLATES = [
  {
    id: 'ecommerce',
    name: 'E-Commerce App',
    description: 'Full-featured online store with product catalog, cart, checkout, and user profiles',
    image: '/api/placeholder/300/180',
    tags: ['Business', 'Shopping'],
    complexity: 'High'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Portal',
    description: 'Patient management system with appointments, medical records, and telemedicine',
    image: '/api/placeholder/300/180',
    tags: ['Healthcare', 'Enterprise'],
    complexity: 'High'
  },
  {
    id: 'social',
    name: 'Social Network',
    description: 'Social platform with profiles, posts, comments, and real-time messaging',
    image: '/api/placeholder/300/180',
    tags: ['Social', 'Entertainment'],
    complexity: 'Medium'
  },
  {
    id: 'delivery',
    name: 'Food Delivery',
    description: 'Food ordering system with restaurant listings, menus, ordering, and delivery tracking',
    image: '/api/placeholder/300/180',
    tags: ['Food', 'Location'],
    complexity: 'Medium'
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    description: 'Health app with workout plans, progress tracking, nutrition diary, and analytics',
    image: '/api/placeholder/300/180',
    tags: ['Health', 'Lifestyle'],
    complexity: 'Medium'
  },
  {
    id: 'realestate',
    name: 'Real Estate Browser',
    description: 'Property listing app with search, filters, virtual tours, and agent contact',
    image: '/api/placeholder/300/180',
    tags: ['Real Estate', 'Business'],
    complexity: 'Medium'
  }
]

// Platform options for mobile apps
const PLATFORMS = [
  { id: 'react-native', name: 'React Native', description: 'Cross-platform (iOS & Android)' },
  { id: 'flutter', name: 'Flutter', description: 'Cross-platform (iOS & Android)' },
  { id: 'ios', name: 'iOS Native (Swift)', description: 'Apple platforms only' },
  { id: 'android', name: 'Android Native (Kotlin)', description: 'Android platforms only' }
]

const MobifyAIDashboard = () => {
  // State variables for app generation
  const [selectedTab, setSelectedTab] = useState(0);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appRequirements, setAppRequirements] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic-claude3');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['react-native']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedApp, setGeneratedApp] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Toast notifications
  const toast = useToast();
  
  // Update generation progress for demo
  useEffect(() => {
    let interval;
    if (isGenerating) {
      // Simulate generation process
      const steps = [
        { progress: 10, step: 'Analyzing requirements...' },
        { progress: 25, step: 'Generating app architecture...' },
        { progress: 40, step: 'Creating UI components...' },
        { progress: 60, step: 'Building database schema...' },
        { progress: 75, step: 'Generating application code...' },
        { progress: 90, step: 'Creating app preview...' },
        { progress: 100, step: 'Finalizing app generation...' },
      ];
      
      let stepIndex = 0;
      interval = setInterval(() => {
        if (stepIndex < steps.length) {
          const { progress, step } = steps[stepIndex];
          setGenerationProgress(progress);
          setGenerationStep(step);
          stepIndex++;
        } else {
          clearInterval(interval);
          setIsGenerating(false);
          handleGenerationComplete();
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);
  
  // Handle platform selection
  const togglePlatform = (platformId) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  }
  
  // Handle generation start
  const handleGenerateApp = () => {
    // Validate form
    if (!appName.trim()) {
      toast({
        title: 'App name required',
        description: 'Please enter a name for your application',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!appRequirements.trim()) {
      toast({
        title: 'Requirements needed',
        description: 'Please describe your app requirements',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Platform selection required',
        description: 'Please select at least one platform',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Start generation
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Initializing...');
  };
  
  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    
    // Pre-fill form with template data
    setAppName(template.name);
    setAppDescription(template.description);
  };
  
  // Handle generation completion
  const handleGenerationComplete = () => {
    // Create mock generated app data
    const generatedAppData = {
      id: 'app-' + Date.now(),
      name: appName,
      description: appDescription || appRequirements.substring(0, 120) + '...',
      platforms: selectedPlatforms.map(p => {
        const platform = PLATFORMS.find(plat => plat.id === p);
        return platform ? platform.name : p;
      }),
      aiModel: AI_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
      generatedAt: new Date().toISOString(),
      preview: '/api/placeholder/300/600',
      codeSize: '4.8 MB',
      screens: 8,
      components: 24,
      apis: 12,
    };
    
    setGeneratedApp(generatedAppData);
    
    // Show success notification
    toast({
      title: 'App generated successfully',
      description: `${appName} has been created!`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    // Switch to the Generated App tab
    setSelectedTab(2);
  };
  
  // Download the generated app
  const handleDownloadApp = () => {
    toast({
      title: 'Download started',
      description: 'Your app code is being prepared for download',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Deploy the generated app
  const handleDeployApp = () => {
    toast({
      title: 'Deployment initiated',
      description: 'Your app is being prepared for deployment',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Box p={6} maxWidth="1600px" mx="auto">
      <Flex mb={6} justifyContent="space-between" alignItems="center">
        <Heading size="xl">MobifyAI Enterprise App Builder</Heading>
        <Button colorScheme="blue">New Project</Button>
      </Flex>
      
      <Tabs index={selectedTab} onChange={setSelectedTab}>
        <TabList>
          <Tab>Create App</Tab>
          <Tab>Templates</Tab>
          <Tab>Generated App</Tab>
          <Tab>Settings</Tab>
        </TabList>
        
        <TabPanels>
          {/* Create App Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              {/* App Form */}
              <GridItem colSpan={{ base: 12, lg: 7 }}>
                <Card mb={6}>
                  <CardHeader>
                    <Heading size="md">App Details</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl mb={4}>
                      <FormLabel>App Name</FormLabel>
                      <Input 
                        placeholder="Enter app name" 
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>Description (optional)</FormLabel>
                      <Textarea 
                        placeholder="Brief description of your app"
                        value={appDescription}
                        onChange={(e) => setAppDescription(e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl mb={6}>
                      <FormLabel>Target Platforms</FormLabel>
                      <Flex flexWrap="wrap" gap={3}>
                        {PLATFORMS.map(platform => (
                          <Button 
                            key={platform.id}
                            variant={selectedPlatforms.includes(platform.id) ? 'solid' : 'outline'}
                            colorScheme={selectedPlatforms.includes(platform.id) ? 'blue' : 'gray'}
                            onClick={() => togglePlatform(platform.id)}
                            size="sm"
                          >
                            {platform.name}
                          </Button>
                        ))}
                      </Flex>
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>AI Model</FormLabel>
                      <Select 
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        {AI_MODELS.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.type}) {model.badge ? `- ${model.badge}` : ''}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Heading size="md">App Requirements</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text mb={2} fontSize="sm" color="gray.600">
                      Describe your app in detail. Include features, functionality, user flows, integrations, and any specific requirements.
                    </Text>
                    <Textarea 
                      placeholder="Build a mobile app for a retail business with inventory tracking, customer loyalty program, and payment integration. The app should have user authentication with role-based access for admins and customers. Include push notifications for low stock alerts and new promotions."
                      value={appRequirements}
                      onChange={(e) => setAppRequirements(e.target.value)}
                      minHeight="200px"
                      mb={6}
                    />
                    
                    <Flex justifyContent="flex-end">
                      <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={handleGenerateApp}
                        isLoading={isGenerating}
                        loadingText="Generating App"
                      >
                        Generate App
                      </Button>
                    </Flex>
                  </CardBody>
                </Card>
              </GridItem>
              
              {/* Generation Status */}
              <GridItem colSpan={{ base: 12, lg: 5 }}>
                <Card mb={6}>
                  <CardHeader>
                    <Heading size="md">Generation Status</Heading>
                  </CardHeader>
                  <CardBody>
                    {isGenerating ? (
                      <Box>
                        <Text mb={2} fontWeight="medium">{generationStep}</Text>
                        <Progress 
                          value={generationProgress} 
                          colorScheme="blue" 
                          height="12px" 
                          mb={4} 
                          borderRadius="full"
                        />
                        <Text fontSize="sm" color="gray.600">
                          This may take several minutes depending on the complexity of your app.
                        </Text>
                      </Box>
                    ) : generatedApp ? (
                      <Box textAlign="center">
                        <Text color="green.500" fontSize="lg" fontWeight="bold" mb={4}>
                          App Generated Successfully
                        </Text>
                        <Button 
                          colorScheme="blue" 
                          onClick={() => setSelectedTab(2)}
                          mb={2}
                          width="full"
                        >
                          View Generated App
                        </Button>
                        <Text fontSize="sm" color="gray.600">
                          Your app is ready! View the details and download the code.
                        </Text>
                      </Box>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text color="gray.500" mb={4}>
                          Fill in the app details and click "Generate App" to start
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Generation typically takes 2-5 minutes for most applications
                        </Text>
                      </Box>
                    )}
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Heading size="md">Popular Templates</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={4}>
                      {APP_TEMPLATES.slice(0, 3).map(template => (
                        <Card key={template.id} variant="outline">
                          <CardBody>
                            <Flex>
                              <Image 
                                src={template.image} 
                                alt={template.name}
                                width="80px"
                                height="80px"
                                borderRadius="md"
                                mr={4}
                              />
                              <Box>
                                <Heading size="sm" mb={1}>{template.name}</Heading>
                                <Text fontSize="sm" mb={2} noOfLines={2}>
                                  {template.description}
                                </Text>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    handleSelectTemplate(template);
                                  }}
                                >
                                  Use Template
                                </Button>
                              </Box>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedTab(1)}
                      >
                        View All Templates
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* Templates Tab */}
          <TabPanel>
            <Flex mb={6} justifyContent="space-between" alignItems="center">
              <Heading size="md">App Templates</Heading>
              <Flex>
                <Input placeholder="Search templates" mr={4} maxWidth="300px" />
                <Select placeholder="All Categories" maxWidth="200px">
                  <option value="business">Business</option>
                  <option value="social">Social</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="food">Food & Delivery</option>
                  <option value="lifestyle">Lifestyle</option>
                </Select>
              </Flex>
            </Flex>
            
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              {APP_TEMPLATES.map(template => (
                <GridItem key={template.id} colSpan={{ base: 12, md: 6, lg: 4 }}>
                  <Card height="100%" _hover={{ transform: 'translateY(-4px)', transition: 'transform 0.3s' }}>
                    <Image 
                      src={template.image} 
                      alt={template.name}
                      height="180px"
                      objectFit="cover"
                    />
                    <CardBody>
                      <Flex mb={2} justifyContent="space-between" alignItems="center">
                        <Heading size="md">{template.name}</Heading>
                        <Badge colorScheme={template.complexity === 'High' ? 'purple' : 'green'}>
                          {template.complexity}
                        </Badge>
                      </Flex>
                      
                      <Text mb={4}>{template.description}</Text>
                      
                      <Flex mb={4} flexWrap="wrap" gap={2}>
                        {template.tags.map(tag => (
                          <Tag key={tag} size="sm" colorScheme="blue" variant="subtle">
                            <TagLabel>{tag}</TagLabel>
                          </Tag>
                        ))}
                      </Flex>
                      
                      <Button 
                        colorScheme="blue" 
                        width="full"
                        onClick={() => {
                          handleSelectTemplate(template);
                          setSelectedTab(0); // Go to create tab
                        }}
                      >
                        Use Template
                      </Button>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </TabPanel>
          
          {/* Generated App Tab */}
          <TabPanel>
            {generatedApp ? (
              <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                <GridItem colSpan={{ base: 12, md: 5, lg: 4 }}>
                  <Card mb={6}>
                    <CardHeader>
                      <Heading size="md">App Preview</Heading>
                    </CardHeader>
                    <CardBody>
                      <Box 
                        borderRadius="lg" 
                        overflow="hidden" 
                        border="1px" 
                        borderColor="gray.200"
                        position="relative"
                        pt="200%"
                      >
                        <Image 
                          src={generatedApp.preview} 
                          alt="App Preview"
                          position="absolute"
                          top="0"
                          left="0"
                          width="100%"
                          height="100%"
                          objectFit="cover"
                        />
                      </Box>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <Heading size="md">App Details</Heading>
                    </CardHeader>
                    <CardBody>
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">App Name</Text>
                          <Text fontWeight="medium">{generatedApp.name}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">Generated With</Text>
                          <Text fontWeight="medium">{generatedApp.aiModel}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">Platforms</Text>
                          <Text fontWeight="medium">{generatedApp.platforms.join(', ')}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">Generated On</Text>
                          <Text fontWeight="medium">{new Date(generatedApp.generatedAt).toLocaleDateString()}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">Code Size</Text>
                          <Text fontWeight="medium">{generatedApp.codeSize}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">Screens</Text>
                          <Text fontWeight="medium">{generatedApp.screens}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">Components</Text>
                          <Text fontWeight="medium">{generatedApp.components}</Text>
                        </GridItem>
                        <GridItem>
                          <Text color="gray.600" fontSize="sm">API Endpoints</Text>
                          <Text fontWeight="medium">{generatedApp.apis}</Text>
                        </GridItem>
                      </Grid>
                      
                      <Divider my={6} />
                      
                      <Stack spacing={3}>
                        <Button colorScheme="blue" onClick={handleDownloadApp}>
                          Download Source Code
                        </Button>
                        <Button colorScheme="green" onClick={handleDeployApp}>
                          Deploy to Test Environment
                        </Button>
                        <Button variant="outline">
                          Generate Documentation
                        </Button>
                      </Stack>
                    </CardBody>
                  </Card>
                </GridItem>
                
                <GridItem colSpan={{ base: 12, md: 7, lg: 8 }}>
                  <Card mb={6}>
                    <CardHeader>
                      <Heading size="md">App Structure</Heading>
                    </CardHeader>
                    <CardBody>
                      <Tabs>
                        <TabList>
                          <Tab>Screens</Tab>
                          <Tab>Components</Tab>
                          <Tab>Data Models</Tab>
                          <Tab>API Endpoints</Tab>
                        </TabList>
                        <TabPanels>
                          <TabPanel>
                            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                              {[
                                'LoginScreen', 
                                'HomeScreen', 
                                'ProfileScreen', 
                                'ProductListScreen',
                                'ProductDetailScreen',
                                'CartScreen',
                                'CheckoutScreen',
                                'OrdersScreen'
                              ].map(screen => (
                                <Card key={screen} variant="outline" p={3}>
                                  <Text fontWeight="medium">{screen}</Text>
                                </Card>
                              ))}
                            </Grid>
                          </TabPanel>
                          <TabPanel>
                            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                              {[
                                'Button', 
                                'Input', 
                                'Card', 
                                'ProductItem',
                                'CartItem',
                                'OrderItem',
                                'Navigation',
                                'Header',
                                'Footer',
                                'Modal',
                                'Alert',
                                'LoadingIndicator'
                              ].map(component => (
                                <Card key={component} variant="outline" p={3}>
                                  <Text fontWeight="medium">{component}</Text>
                                </Card>
                              ))}
                            </Grid>
                          </TabPanel>
                          <TabPanel>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                              {[
                                'User', 
                                'Product', 
                                'Category', 
                                'Cart',
                                'Order',
                                'Payment'
                              ].map(model => (
                                <Card key={model} variant="outline" p={4}>
                                  <Heading size="sm" mb={2}>{model}</Heading>
                                  <Text fontSize="sm" mb={1}>Fields:</Text>
                                  <Text fontSize="xs" fontFamily="monospace">
                                    id: string<br />
                                    name: string<br />
                                    description: string<br />
                                    createdAt: Date<br />
                                    updatedAt: Date
                                  </Text>
                                </Card>
                              ))}
                            </Grid>
                          </TabPanel>
                          <TabPanel>
                            <Stack spacing={3}>
                              {[
                                { method: 'GET', path: '/api/products', desc: 'Get all products' },
                                { method: 'GET', path: '/api/products/:id', desc: 'Get product by ID' },
                                { method: 'POST', path: '/api/products', desc: 'Create new product' },
                                { method: 'GET', path: '/api/users/me', desc: 'Get current user' },
                                { method: 'POST', path: '/api/orders', desc: 'Create new order' },
                                { method: 'GET', path: '/api/orders', desc: 'Get user orders' }
                              ].map((endpoint, index) => (
                                <Card key={index} variant="outline">
                                  <CardBody>
                                    <Flex justify="space-between" mb={2}>
                                      <Text fontWeight="bold" fontFamily="monospace">
                                        {endpoint.path}
                                      </Text>
                                      <Badge colorScheme={
                                        endpoint.method === 'GET' ? 'green' : 
                                        endpoint.method === 'POST' ? 'blue' : 
                                        endpoint.method === 'PUT' ? 'orange' : 'red'
                                      }>
                                        {endpoint.method}
                                      </Badge>
                                    </Flex>
                                    <Text fontSize="sm">{endpoint.desc}</Text>
                                  </CardBody>
                                </Card>
                              ))}
                            </Stack>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </CardBody>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <Heading size="md">Code Explorer</Heading>
                    </CardHeader>
                    <CardBody>
                      <Tabs>
                        <TabList>
                          <Tab>App.tsx</Tab>
                          <Tab>HomeScreen.tsx</Tab>
                          <Tab>ProductDetail.tsx</Tab>
                        </TabList>
                        <TabPanels>
                          <TabPanel>
                            <Box 
                              bg="gray.50" 
                              p={4} 
                              borderRadius="md" 
                              fontFamily="monospace"
                              fontSize="sm"
                              overflowX="auto"
                            >
                              <Text color="purple.600">import</Text>
                              <Text color="black"> React </Text>
                              <Text color="purple.600">from</Text>
                              <Text color="green.600"> 'react'</Text>
                              <Text>;</Text>
                              <br />
                              <Text color="purple.600">import</Text>
                              <Text color="black"> {'{ SafeAreaProvider }'} </Text>
                              <Text color="purple.600">from</Text>
                              <Text color="green.600"> 'react-native-safe-area-context'</Text>
                              <Text>;</Text>
                              <br />
                              <Text color="purple.600">import</Text>
                              <Text color="black"> {'{ NavigationContainer }'} </Text>
                              <Text color="purple.600">from</Text>
                              <Text color="green.600"> '@react-navigation/native'</Text>
                              <Text>;</Text>
                              <br />
                              <Text color="purple.600">import</Text>
                              <Text color="black"> {'{ ThemeProvider }'} </Text>
                              <Text color="purple.600">from</Text>
                              <Text color="green.600"> './theme/ThemeContext'</Text>
                              <Text>;</Text>
                              <br />
                              <Text color="purple.600">import</Text>
                              <Text color="black"> {'AppNavigator'} </Text>
                              <Text color="purple.600">from</Text>
                              <Text color="green.600"> './navigation/AppNavigator'</Text>
                              <Text>;</Text>
                              <br />
                              <Text color="purple.600">import</Text>
                              <Text color="black"> {'{ AuthProvider }'} </Text>
                              <Text color="purple.600">from</Text>
                              <Text color="green.600"> './contexts/AuthContext'</Text>
                              <Text>;</Text>
                              <br />
                              <br />
                              <Text color="purple.600">const</Text>
                              <Text color="blue.600"> App </Text>
                              <Text color="purple.600">=</Text>
                              <Text color="red.600"> () </Text>
                              <Text color="purple.600">= </Text>
                              <Text color="black">{`{`}</Text>
                              <br />
                              <Text ml={4} color="black">return (</Text>
                              <br />
                              <Text ml={8} color="black">{`<SafeAreaProvider>`}</Text>
                              <br />
                              <Text ml={12} color="black">{`<ThemeProvider>`}</Text>
                              <br />
                              <Text ml={16} color="black">{`<AuthProvider>`}</Text>
                              <br />
                              <Text ml={20} color="black">{`<NavigationContainer>`}</Text>
                              <br />
                              <Text ml={24} color="black">{`<AppNavigator />`}</Text>
                              <br />
                              <Text ml={20} color="black">{`</NavigationContainer>`}</Text>
                              <br />
                              <Text ml={16} color="black">{`</AuthProvider>`}</Text>
                              <br />
                              <Text ml={12} color="black">{`</ThemeProvider>`}</Text>
                              <br />
                              <Text ml={8} color="black">{`</SafeAreaProvider>`}</Text>
                              <br />
                              <Text ml={4} color="black">);</Text>
                              <br />
                              <Text color="black">{`};`}</Text>
                              <br />
                              <br />
                              <Text color="purple.600">export</Text>
                              <Text color="purple.600"> default</Text>
                              <Text color="black"> App;</Text>
                            </Box>
                          </TabPanel>
                          
                          <TabPanel>
                            <Box 
                              bg="gray.50" 
                              p={4} 
                              borderRadius="md" 
                              fontFamily="monospace"
                              fontSize="sm"
                              overflowX="auto"
                            >
                              {/* HomeScreen code would be here */}
                              <Text color="gray.500">// HomeScreen.tsx code would appear here</Text>
                            </Box>
                          </TabPanel>
                          
                          <TabPanel>
                            <Box 
                              bg="gray.50" 
                              p={4} 
                              borderRadius="md" 
                              fontFamily="monospace"
                              fontSize="sm"
                              overflowX="auto"
                            >
                              {/* ProductDetail code would be here */}
                              <Text color="gray.500">// ProductDetail.tsx code would appear here</Text>
                            </Box>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>
            ) : (
              <Box textAlign="center" py={12}>
                <Heading size="md" mb={4} color="gray.500">No Generated App Yet</Heading>
                <Text mb={6}>You haven't generated any apps yet. Create a new app to get started.</Text>
                <Button colorScheme="blue" onClick={() => setSelectedTab(0)}>
                  Create New App
                </Button>
              </Box>
            )}
          </TabPanel>
          
          {/* Settings Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <Card mb={6}>
                  <CardHeader>
                    <Heading size="md">AI Model Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl mb={4}>
                      <FormLabel>Default AI Model</FormLabel>
                      <Select defaultValue="anthropic-claude3">
                        {AI_MODELS.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.type})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl mb={6}>
                      <FormLabel>Temperature</FormLabel>
                      <Flex align="center">
                        <Box flex="1">
                          <Input type="range" min="0" max="1" step="0.1" defaultValue="0.7" />
                        </Box>
                        <Box ml={4} minWidth="40px">
                          <Text>0.7</Text>
                        </Box>
                      </Flex>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Controls randomness: lower values for predictable outputs, higher for creative ones
                      </Text>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>API Keys</FormLabel>
                      <Stack spacing={4}>
                        <Box>
                          <Flex justify="space-between" mb={1}>
                            <Text fontSize="sm">OpenAI API Key</Text>
                            <Badge colorScheme="green">Connected</Badge>
                          </Flex>
                          <Input type="password" value="sk-••••••••••••••••••••••" isReadOnly />
                        </Box>
                        
                        <Box>
                          <Flex justify="space-between" mb={1}>
                            <Text fontSize="sm">Anthropic API Key</Text>
                            <Badge colorScheme="green">Connected</Badge>
                          </Flex>
                          <Input type="password" value="sk-ant-••••••••••••••••••••••" isReadOnly />
                        </Box>
                        
                        <Box>
                          <Flex justify="space-between" mb={1}>
                            <Text fontSize="sm">Google AI API Key</Text>
                            <Badge colorScheme="green">Connected</Badge>
                          </Flex>
                          <Input type="password" value="AIza••••••••••••••••••••••" isReadOnly />
                        </Box>
                      </Stack>
                    </FormControl>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Heading size="md">Local Models</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl mb={4} display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Enable Local Models</FormLabel>
                      <Switch colorScheme="blue" defaultChecked />
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>Local Model Path</FormLabel>
                      <Input defaultValue="/home/user/models" />
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>Default Local Model</FormLabel>
                      <Select defaultValue="llama3-70b">
                        <option value="llama3-70b">Llama 3 (70B)</option>
                        <option value="llama3-8b">Llama 3 (8B)</option>
                        <option value="mistral-7b">Mistral 7B</option>
                        <option value="falcon-40b">Falcon 40B</option>
                      </Select>
                    </FormControl>
                  </CardBody>
                </Card>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <Card mb={6}>
                  <CardHeader>
                    <Heading size="md">Code Generation Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl mb={4}>
                      <FormLabel>Default Platform</FormLabel>
                      <Select defaultValue="react-native">
                        {PLATFORMS.map(platform => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>Architecture Pattern</FormLabel>
                      <Select defaultValue="mvvm">
                        <option value="mvc">MVC</option>
                        <option value="mvvm">MVVM</option>
                        <option value="clean">Clean Architecture</option>
                        <option value="redux">Redux Architecture</option>
                      </Select>
                    </FormControl>
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
                      <GridItem>
                        <FormControl display="flex" alignItems="center">
                          <Switch colorScheme="blue" id="typescript" defaultChecked mr={2} />
                          <FormLabel htmlFor="typescript" mb="0">TypeScript</FormLabel>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl display="flex" alignItems="center">
                          <Switch colorScheme="blue" id="tests" defaultChecked mr={2} />
                          <FormLabel htmlFor="tests" mb="0">Generate Tests</FormLabel>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl display="flex" alignItems="center">
                          <Switch colorScheme="blue" id="docs" defaultChecked mr={2} />
                          <FormLabel htmlFor="docs" mb="0">Documentation</FormLabel>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl display="flex" alignItems="center">
                          <Switch colorScheme="blue" id="i18n" mr={2} />
                          <FormLabel htmlFor="i18n" mb="0">Internationalization</FormLabel>
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Heading size="md">Deployment Settings</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl mb={4}>
                      <FormLabel>Default Deployment Target</FormLabel>
                      <Select defaultValue="aws">
                        <option value="aws">AWS Amplify</option>
                        <option value="firebase">Firebase</option>
                        <option value="vercel">Vercel</option>
                        <option value="azure">Azure Mobile Apps</option>
                        <option value="gcp">Google Cloud Platform</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl mb={4}>
                      <FormLabel>CI/CD Pipeline</FormLabel>
                      <Select defaultValue="github">
                        <option value="github">GitHub Actions</option>
                        <option value="gitlab">GitLab CI</option>
                        <option value="jenkins">Jenkins</option>
                        <option value="azure">Azure DevOps</option>
                      </Select>
                    </FormControl>
                    
                    <Button colorScheme="blue" width="full" mt={6}>
                      Save Settings
                    </Button>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const { data: projects, error, isLoading } = useQuery('projects', getProjects);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading projects</div>;

  return <MobifyAIDashboard />;
};

export default MobifyAIDashboard;