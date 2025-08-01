<!-- markdownlint-disable -->
# Project Development Guidelines

## Overview

This document provides comprehensive guidelines for building scalable, maintainable, and production-ready applications. It covers architecture patterns, technology selection, best practices, and implementation strategies for projects of various sizes and complexities.

## Quick Start Guide

**For Immediate Project Setup:**

1. **Choose Project Size** - Small, Medium, or Large
2. **Select Technology Stack** - Use the Technology Selection Matrix
3. **Set Up Monorepo** - Follow the Monorepo Structure
4. **Initialize Core Services** - Backend (Fastify), Frontend (React + Vite), Database (PostgreSQL)
5. **Configure Development Environment** - Docker Compose for local development
6. **Implement Core Features** - Authentication, Basic CRUD, State Management
7. **Add Testing** - Unit tests, Integration tests, E2E tests
8. **Set Up CI/CD** - GitHub Actions with automated testing
9. **Deploy to Production** - Follow Deployment Strategy guidelines

**Essential First Steps:**
- Set up pnpm workspaces
- Initialize TypeScript configuration
- Configure ESLint and Prettier
- Set up Docker development environment
- Create basic API endpoints
- Implement frontend routing
- Add database schema and migrations

## Architecture Patterns

### 1. Monorepo Structure

**When to Use:**

- Multiple related applications
- Shared code and dependencies
- Coordinated releases
- Team collaboration on related services

**Best Practices:**

- Use pnpm workspaces for efficient package management
- Clear separation between frontend, backend, and shared packages
- Consistent package manager across all packages
- Root-level scripts for common operations
- Proper workspace configuration

**Structure Example:**

```
project/
├── apps/
│   ├── user/              # User-facing web application
│   ├── admin/             # Admin dashboard/management
│   └── api/               # Backend API service
├── packages/
│   ├── shared-types/      # TypeScript types
│   ├── ui-components/     # Shared React components
│   └── utils/             # Shared utilities
├── tools/
└── docs/
```

### 2. Backend Architecture

#### **Framework Selection**

**Express.js (Recommended for Small-Medium Projects)**

- Large ecosystem and community
- Excellent TypeScript support
- Fast development with minimal boilerplate
- Great for REST APIs and microservices
- Extensive middleware ecosystem

**Fastify (Recommended for Performance-Critical Applications)**

- Excellent performance (2-3x faster than Express/NestJS)
- Built-in schema validation with JSON Schema
- TypeScript support
- Plugin ecosystem for extensibility
- Low memory footprint
- Great for high-frequency APIs
- Real-time application support (WebSockets, SSE)
- Minimal overhead and bundle size
- Excellent for microservices architecture
- Built-in request/response serialization

#### **Architecture Patterns**

**MVC Pattern:**

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Data access
├── models/          # Data models
├── middleware/      # Express middleware
├── routes/          # Route definitions
└── types.ts         # TypeScript types
```

**Clean Architecture:**

```
src/
├── domain/          # Business entities and rules
├── application/     # Use cases and application logic
├── infrastructure/  # External concerns (DB, APIs)
└── presentation/    # Controllers and DTOs
```

### 3. Database Design

#### **Database Selection**

**PostgreSQL (Recommended Database)**

- **ACID compliance** - Full transaction support with rollback capabilities
- **Complex transactions** - Multi-table transactions with consistency guarantees
- **JSON support** - Native JSONB for flexible data alongside structured data
- **Advanced indexing** - GIN, GiST, and composite indexes for performance
- **Full-text search** - Built-in search capabilities
- **Excellent performance** for complex queries and joins
- **Rich ecosystem** of tools and ORMs
- **Data integrity** - Foreign keys, constraints, and triggers
- **Mature and battle-tested** - Production-ready for critical applications
- **Scalability** - Read replicas, partitioning, and clustering
- **Extensibility** - Custom functions, procedures, and extensions

#### **PostgreSQL Transaction Capabilities**

**Complex Multi-Table Transactions:**
- **E-commerce order processing** - Create orders, update user balances, manage inventory
- **Financial transactions** - Transfer funds, update account balances, record transactions
- **Inventory management** - Update stock levels, process orders, track movements
- **User management** - Create accounts, assign roles, update profiles

**Transaction Benefits:**
- **Data consistency** - All operations succeed or all fail
- **Business logic integrity** - Complex workflows remain atomic
- **Error handling** - Automatic rollback on failures
- **Performance** - Optimized for high-frequency transactions

#### **ORM Selection**

**Prisma (Recommended)**

- **Type-safe database access** - Compile-time type checking
- **Auto-generated migrations** - Schema evolution made simple
- **Excellent TypeScript integration** - Full type safety
- **Built-in connection pooling** - Optimized database connections
- **Great developer experience** - Intuitive CLI and tooling
- **Schema-first approach** - Clear data model definition
- **Query optimization** - Efficient query generation
- **Database introspection** - Reverse engineering existing databases

#### **Database Best Practices**

**Connection Pooling:**

- Maximum connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Query timeout: 30 seconds
- SSL configuration for production
- Pool monitoring and error handling

**Indexing Strategy:**

- Single column indexes for frequently queried fields
- Composite indexes for complex queries
- Full-text search indexes for text search
- Foreign key indexes for relationships
- Sort order indexes for pagination

**Query Optimization:**

- Avoid N+1 queries with includes and joins
- Use Common Table Expressions for complex filtering
- Implement cursor-based pagination for large datasets
- Use database constraints for data integrity
- Monitor slow queries and performance

### 4. API Design

#### **REST vs GraphQL Deep Comparison**

**REST API (Recommended for Most Projects)**

**Performance Advantages:**
- **HTTP caching** - Browser, CDN, and proxy caching work out of the box
- **Predictable performance** - Fixed endpoint response times
- **Simple debugging** - Clear request/response patterns
- **CDN optimization** - Static resource caching
- **Load balancing** - Standard HTTP load balancers
- **Rate limiting** - Easy to implement per endpoint

**Development Advantages:**
- **Wide adoption** - Every developer understands REST
- **Great tooling** - Postman, Insomnia, curl support
- **Easy documentation** - OpenAPI/Swagger integration
- **Stateless design** - Scales horizontally
- **Versioning** - Clear versioning strategies

**Performance Limitations:**
- **Over-fetching** - Getting more data than needed
- **Under-fetching** - Multiple requests for related data
- **N+1 problems** - Multiple round trips for nested data
- **Rigid structure** - Fixed response format per endpoint

**GraphQL (For Complex Data Requirements)**

**Performance Advantages:**
- **Precise data fetching** - Only get what you need
- **Single request** - Multiple resources in one query
- **Real-time subscriptions** - WebSocket-based updates
- **No versioning** - Schema evolution without breaking changes
- **Type safety** - Compile-time query validation

**Development Advantages:**
- **Self-documenting** - Introspection and schema exploration
- **Excellent tooling** - GraphiQL, Apollo Studio
- **Flexible queries** - Dynamic field selection
- **Strong typing** - TypeScript integration
- **Developer experience** - Great frontend integration

**Performance Challenges:**
- **Complex caching** - Query-based caching strategies
- **N+1 query problems** - Resolver optimization required
- **Query complexity** - Deep queries can be expensive
- **Security overhead** - Query depth and complexity limits
- **Learning curve** - Steeper for backend developers

#### **Hybrid Approach: When to Use Both**

**Use REST for:**
- **Public APIs** - Third-party integrations
- **Simple CRUD operations** - Basic resource management
- **File uploads/downloads** - Binary data handling
- **Caching-heavy operations** - Frequently accessed data
- **Mobile applications** - Limited bandwidth considerations
- **CDN integration** - Static resource delivery

**Use GraphQL for:**
- **Complex dashboards** - Multiple data sources
- **Real-time features** - Live updates and subscriptions
- **Mobile apps** - Precise data fetching for bandwidth
- **Internal APIs** - Team productivity and flexibility
- **Microservices** - Data aggregation and composition
- **Admin interfaces** - Dynamic data requirements

**Hybrid Implementation Strategy:**
- **REST for external APIs** - Public endpoints with caching
- **GraphQL for internal APIs** - Team productivity and flexibility
- **Shared authentication** - Unified security layer
- **Common data layer** - Same database and business logic
- **Performance monitoring** - Track both API types separately

#### **REST API Best Practices**

**Endpoint Design:**

- Use nouns, not verbs: `/users` not `/getUsers`
- Consistent plural naming
- Hierarchical resources: `/users/{id}/posts`
- Proper HTTP methods (GET, POST, PUT, DELETE, PATCH)

**Response Standards:**

- Consistent JSON structure
- Proper HTTP status codes
- Pagination metadata
- Error response format
- Content-Type headers

**Performance Optimization:**

- HTTP caching headers
- Response compression
- Pagination for large datasets
- Field selection (partial responses)
- Rate limiting

### 5. Frontend Architecture

#### **Framework Selection**

**React + Vite + TypeScript (Recommended for Performance-Critical Apps)**

**Vite as React Build Tool:**
- **Vite** is a build tool that works with React (not a framework)
- **React** is the UI library that Vite builds and serves
- **Perfect combination** - Vite's speed + React's ecosystem
- **Official support** - Vite has first-class React support

**Performance Advantages:**
- **Extremely fast development** - Vite's instant hot reload for React
- **Optimized builds** - Tree shaking and code splitting for React apps
- **No vendor lock-in** - Full control over deployment
- **Excellent TypeScript support** - Type safety throughout
- **Plugin ecosystem** - Extensible build process
- **Great performance out of the box** - Optimized defaults

**Development Advantages:**
- **Large ecosystem** - Extensive React libraries and tools
- **Component-based architecture** - Reusable React components
- **Great developer tools** - React DevTools, Vite DevTools
- **Extensive community support** - Rich documentation and help
- **React Router** - Declarative routing with performance

#### **State Management**

**Server State: TanStack Query (Recommended)**

**Performance Advantages:**
- **Automatic caching** - Intelligent background updates and cache invalidation
- **Optimistic updates** - Instant UI feedback without waiting for server
- **Background refetching** - Keeps data fresh without blocking UI
- **Request deduplication** - Prevents duplicate API calls
- **Cache time optimization** - Configurable stale time and garbage collection

**Developer Experience:**
- **Error handling** - Built-in error states and retry logic
- **Loading states** - Automatic loading indicators
- **DevTools** - Excellent debugging and monitoring tools
- **No vendor lock-in** - Works with any API
- **Excellent TypeScript support** - Full type safety

**Client State: Zustand (Recommended)**

**Performance Advantages:**
- **Minimal bundle size** - Only 2.5KB gzipped
- **No providers needed** - Reduces component tree complexity
- **Selective re-renders** - Only components that use changed state re-render
- **Great performance** - Optimized for React's rendering cycle
- **No boilerplate** - Simple API with maximum flexibility

**Developer Experience:**
- **Simple and lightweight** - Easy to learn and use
- **TypeScript support** - Full type safety
- **Middleware support** - Extensible with plugins
- **DevTools integration** - Built-in debugging tools

#### **Styling**

**Tailwind CSS (Recommended)**

- Utility-first approach
- Excellent performance
- Great developer experience
- Consistent design system

**CSS Modules (Alternative)**

- Component-scoped styling
- No naming conflicts
- TypeScript support
- Better performance than CSS-in-JS

### 6. Caching Strategy

#### **Redis Implementation**

**Cache Configuration:**

- Default TTL: 5 minutes
- Maximum TTL: 1 hour
- Key prefix for organization
- Compression for large values

**Caching Best Practices:**

- Cache frequently accessed data
- Implement cache invalidation on data updates
- Use cache warming for critical data
- Monitor cache hit rates for optimization
- Implement cache fallbacks for resilience

### 7. Performance Optimization

#### **Performance Targets**

**Backend Performance Targets:**
- **API Response Time** - < 200ms for 95th percentile
- **Database Query Time** - < 100ms for complex queries
- **Throughput** - > 1000 requests/second per instance
- **Memory Usage** - < 512MB per service instance
- **CPU Usage** - < 70% under normal load

**Frontend Performance Targets:**
- **First Contentful Paint** - < 1.5 seconds
- **Largest Contentful Paint** - < 2.5 seconds
- **Time to Interactive** - < 3.5 seconds
- **Bundle Size** - < 500KB gzipped for main bundle
- **Core Web Vitals** - All metrics in "Good" range

#### **Backend Performance**

**Database Optimization:**

- **Connection pooling** - Optimize connection management
- **Query optimization** - Use indexes and query analysis
- **CTEs for complex queries** - Improve query readability and performance
- **Pagination implementation** - Cursor-based pagination for large datasets
- **Slow query monitoring** - Track and optimize slow queries
- **Query caching** - Cache frequently accessed data

**API Performance:**

- **Response compression** - Gzip/Brotli compression
- **Rate limiting** - Prevent API abuse
- **HTTP caching headers** - Leverage browser and CDN caching
- **Field selection** - Partial responses for bandwidth optimization
- **Health checks** - Monitor service availability
- **Request/response optimization** - Minimize payload sizes

#### **Frontend Performance**

**Code Splitting Strategy:**

- **Route-based splitting** - Separate bundles per route
- **Component lazy loading** - React.lazy for heavy components
- **Dynamic imports** - Load libraries on demand
- **Bundle analysis** - Monitor and optimize bundle sizes
- **Vendor chunk splitting** - Separate third-party libraries

**Image Optimization:**

- **WebP format support** - Modern image format with better compression
- **Lazy loading** - Load images as they enter viewport
- **Responsive images** - Serve appropriate sizes for different devices
- **CDN integration** - Distribute images globally
- **Image compression** - Optimize file sizes without quality loss

**Bundle Optimization:**

- **Tree shaking** - Remove unused code
- **Minification** - Compress JavaScript and CSS
- **Compression** - Gzip/Brotli for all assets
- **Vendor chunk splitting** - Separate third-party libraries
- **Bundle size monitoring** - Track bundle growth over time

### 8. Security Guidelines

#### **Authentication & Authorization**

**JWT Implementation:**

- Secure token generation
- Proper expiration times
- Refresh token strategy
- Token rotation
- Secure storage on client

**Role-Based Access Control (RBAC):**

- User roles and permissions
- Resource-level access control
- API endpoint protection
- Audit logging

#### **API Security**

**Input Validation:**

- Schema validation (Joi, Zod)
- SQL injection prevention
- XSS protection
- File upload validation
- Request size limits

**Infrastructure Security:**

- HTTPS enforcement
- CORS configuration
- Rate limiting
- Security headers
- Environment variable protection

### 9. Testing Strategy

#### **Testing Pyramid**

**Unit Testing (70%):**

- Jest for backend testing
- React Testing Library for components
- Mock external dependencies
- Test business logic thoroughly
- Maintain >80% coverage

**Integration Testing (20%):**

- API endpoint testing
- Database integration tests
- External service mocking
- End-to-end workflows

**E2E Testing (10%):**

- Playwright for cross-browser testing
- Critical user journeys
- Visual regression testing
- Performance testing

#### **Testing Best Practices**

**Test Organization:**

- Clear test file structure
- Descriptive test names
- Arrange-Act-Assert pattern
- Proper test isolation
- Mock external dependencies

**Test Data Management:**

- Factory functions for test data
- Database seeding
- Test database isolation
- Cleanup after tests

### 10. DevOps & Infrastructure

#### **Containerization Strategies**

**Recommended Monorepo Docker Approach (Medium-Large Projects):**

**Project Structure:**

```
project/
├── apps/
│   ├── user/              # User-facing web application
│   ├── admin/             # Admin dashboard/management
│   └── api/               # Backend API service
├── packages/
│   ├── shared-types/      # TypeScript types
│   ├── ui-components/     # Shared React components
│   └── utils/             # Shared utilities
├── docker/
│   └── base.dockerfile    # Shared base image
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # Workspace configuration
└── docker-compose.yml     # Service orchestration
```

**Docker Compose Setup:**

- **Multi-service orchestration** - User, admin, and API services
- **Service dependencies** - Proper startup order management
- **Environment configuration** - Service-specific environment variables
- **Volume management** - Persistent data storage for database and cache
- **Port mapping** - External access to services
- **Health checks** - Service availability monitoring

**Dockerfile Strategy:**

- **Multi-stage builds** - Separate build and production stages
- **Layer optimization** - Efficient dependency installation
- **Security hardening** - Non-root user execution
- **Production optimization** - Minimal runtime images
- **Shared package building** - Efficient monorepo builds

**Why This Approach:**

**1. Optimized for Medium-Large Projects:**

- Multi-stage builds for smaller production images
- Layer caching for faster builds
- Shared dependencies across services
- Type safety with shared packages

**2. Production Ready:**

- Non-root user execution
- Health checks and monitoring
- Environment-specific configurations
- Proper resource management

**3. Developer Friendly:**

- Hot reloading in development
- Shared code between services
- Consistent tooling across apps
- Easy local development setup

**Docker Best Practices:**

**Development Environment:**

- Use Docker Compose for local development
- Mount source code as volumes for hot reloading
- Separate development and production configurations
- Health checks for service dependencies
- Environment-specific configurations

**Production Environment:**

- Multi-stage builds for smaller images
- Security scanning in CI/CD pipeline
- Layer caching optimization
- Non-root user execution
- Resource limits and constraints

**Container Orchestration:**

**Docker Compose (Development/Small Scale):**

- Easy local development setup
- Service dependency management
- Environment variable management
- Volume mounting for development

**Kubernetes (Production/Large Scale):**

- Auto-scaling capabilities
- Service discovery and load balancing
- Rolling updates and rollbacks
- Resource management and monitoring

#### **CI/CD Pipeline**

**GitHub Actions (Recommended):**

- Automated testing on push/PR
- Build and deployment automation
- Environment-specific deployments
- Security scanning integration

**Deployment Strategies:**

- Blue-green deployment
- Rolling updates
- Canary releases
- Feature flags

#### **Deployment Automation Scripts**

**Custom Deployment Scripts (Recommended for Complex Projects):**

**Script Categories:**
- **Startup scripts** - Automated application initialization
- **Deployment scripts** - Environment-specific deployments
- **Health check scripts** - Service monitoring and diagnostics
- **Troubleshooting scripts** - Automated problem resolution
- **Cross-platform scripts** - Windows, Linux, macOS compatibility

**Script Best Practices:**
- **Cross-platform compatibility** - Use Node.js for portability
- **Comprehensive error handling** - Graceful failure with fallbacks
- **User-friendly output** - Colored console messages and progress indicators
- **Health monitoring** - Automated service status checks
- **Diagnostic capabilities** - Built-in troubleshooting tools
- **Environment detection** - Automatic IP and platform detection
- **Service orchestration** - Coordinated startup and shutdown

**Script Structure:**
- **Modular design** - Separate concerns (deployment, health checks, diagnostics)
- **Configuration-driven** - Environment-specific settings
- **Logging and monitoring** - Detailed execution logs
- **Rollback capabilities** - Quick recovery from failed deployments
- **Team collaboration** - Shared scripts for consistent workflows

**When to Use Custom Scripts:**

**Use Custom Scripts When:**
- **Complex deployment workflows** - Multiple services with dependencies
- **Cross-platform requirements** - Teams using different operating systems
- **Custom health checks** - Application-specific monitoring needs
- **Team productivity** - Reducing manual deployment steps
- **Production environments** - Reliable, repeatable deployments
- **Debugging needs** - Automated troubleshooting capabilities

**Use Standard Tools When:**
- **Simple deployments** - Single service or basic applications
- **Cloud-native deployments** - Kubernetes, serverless platforms
- **Standard workflows** - Common deployment patterns
- **Small teams** - Limited automation requirements
- **Third-party platforms** - Vercel, Netlify, Heroku

#### **Environment Configuration**

**Environment Management:**

- **Development** - Local development with hot reloading
- **Staging** - Production-like environment for testing
- **Production** - Optimized for performance and security
- **Environment variables** - Secure configuration management
- **Feature flags** - Gradual feature rollouts

**Configuration Strategy:**

- **Environment-specific configs** - Separate settings per environment
- **Secret management** - Secure handling of sensitive data
- **Configuration validation** - Validate all environment variables
- **Default values** - Sensible defaults for development
- **Configuration documentation** - Clear documentation of all settings

#### **Deployment Strategy**

**Deployment Approaches:**

- **Blue-green deployment** - Zero-downtime deployments
- **Rolling updates** - Gradual service updates
- **Canary releases** - Gradual traffic shifting
- **Feature flags** - Runtime feature toggles
- **Database migrations** - Safe schema evolution

**Deployment Pipeline:**

- **Automated testing** - Run tests before deployment
- **Security scanning** - Vulnerability assessment
- **Performance testing** - Load testing in staging
- **Health checks** - Verify deployment success
- **Rollback strategy** - Quick rollback on issues

#### **Monitoring & Observability**

**Application Monitoring:**

- **Error tracking** - Sentry for real-time error monitoring
- **Performance monitoring** - New Relic/DataDog for APM
- **Custom metrics** - Business-specific performance metrics
- **User experience monitoring** - Real User Monitoring (RUM)
- **Synthetic monitoring** - Automated health checks

**Infrastructure Monitoring:**

- **System metrics** - Prometheus + Grafana for infrastructure
- **Log aggregation** - ELK Stack for centralized logging
- **Health checks** - Service availability monitoring
- **Alert management** - Proactive issue detection
- **Capacity planning** - Resource usage tracking and forecasting

### 11. Error Handling & Logging

#### **Error Handling**

**Structured Error Classes:**

- Custom error types
- HTTP status code mapping
- Error codes for categorization
- Stack trace capture
- Context preservation

**Error Handling Best Practices:**

- Global error handlers
- Consistent error responses
- Error logging with context
- User-friendly error messages
- Error boundaries in React

#### **Logging**

**Structured Logging:**

- JSON format for machine readability
- Log levels (error, warn, info, debug)
- Request correlation IDs
- Performance metrics
- Security event logging

**Logging Best Practices:**

- Centralized log management
- Log rotation and retention
- Performance impact monitoring
- Security-sensitive data filtering

### 12. Microservices Architecture

#### **When to Consider Microservices**

**Good Candidates:**

- Large teams (10+ developers)
- Complex domain with clear bounded contexts
- High scalability requirements
- Different technology needs per service
- Independent deployment requirements

**Avoid When:**

- Small team (< 5 developers)
- Simple domain with tight coupling
- Limited scalability requirements
- Tight budget and time constraints

#### **Microservices Patterns**

**Service Communication:**

- Synchronous HTTP communication
- Asynchronous event-driven communication
- Service discovery and registration
- Load balancing and health checks

**Data Management:**

- Saga pattern for distributed transactions
- Event sourcing for audit trails
- CQRS for read/write separation
- Database per service pattern

#### **Microservices Technology Stack**

**Service Mesh: Istio**

- Traffic management and routing
- Service discovery and load balancing
- Security and authentication
- Observability and monitoring

**Message Broker: Apache Kafka**

- Event-driven communication
- Reliable message delivery
- Scalable event streaming
- Message persistence and replay

**API Gateway: Kong**

- Centralized routing and load balancing
- Rate limiting and authentication
- Request/response transformation
- Plugin ecosystem for extensibility

### 13. Technology Selection Matrix

| Project Size | Backend | Frontend | Database | State Management | Testing |
|-------------|---------|----------|----------|------------------|---------|
| **Small** | Express.js | React + Vite | PostgreSQL | Zustand | Jest + RTL |
| **Medium** | Fastify | React + Vite | PostgreSQL + Redis | TanStack Query + Zustand | Jest + RTL + Playwright |
| **Large** | Fastify | React + Vite | PostgreSQL + Redis + Elasticsearch | TanStack Query + Zustand | Jest + RTL + Playwright + Cypress |

### 14. Implementation Priority Matrix

| Component | Priority | Effort | Impact | Timeline |
|-----------|----------|--------|--------|----------|
| ORM Implementation | High | Medium | High | Week 1-2 |
| Caching Strategy | High | Low | High | Week 1 |
| Authentication | High | Medium | High | Week 2-3 |
| Testing Setup | Medium | Medium | High | Week 2-3 |
| Monitoring | Medium | High | Medium | Week 4-5 |
| Performance Optimization | Low | High | Medium | Week 5-6 |

### 15. Vendor Lock-in Avoidance

#### **Open Source Alternatives**

| Vendor Solution | Open Source Alternative | Benefits |
|----------------|------------------------|----------|
| **Vercel (Next.js)** | **Netlify/Vite** | No vendor lock-in, better performance |
| **AWS Amplify** | **Supabase/Firebase** | Open source backend, self-hostable |
| **MongoDB Atlas** | **PostgreSQL + Prisma** | Better performance, ACID compliance |
| **Auth0** | **Supabase Auth/Keycloak** | Self-hostable, no vendor dependency |
| **Stripe** | **PayPal/Adyen** | Multiple payment providers |
| **SendGrid** | **Resend/Nodemailer** | Self-hostable email solutions |

#### **Technology Stack for Vendor Independence**

- **Frontend**: Vite + React Router (no vendor lock-in)
- **Backend**: NestJS + PostgreSQL (self-hostable)
- **Database**: PostgreSQL + Prisma (open source)
- **Authentication**: Supabase Auth or Keycloak
- **Deployment**: Docker + Cloud provider of choice
- **Monitoring**: Prometheus + Grafana (self-hosted)
- **CDN**: Cloudflare or self-hosted solution

## Conclusion

This comprehensive guide provides a roadmap for building production-ready applications with focus on performance, security, maintainability, and scalability. The recommendations are based on proven patterns and technologies that work well across different project sizes and domains.

Key principles to follow:

1. **Start simple** and add complexity as needed
2. **Choose technologies** based on team expertise and project requirements
3. **Focus on fundamentals** before advanced patterns
4. **Prioritize maintainability** over premature optimization
5. **Implement comprehensive testing** from the start
6. **Plan for scalability** but don't over-engineer
7. **Avoid vendor lock-in** when possible
8. **Monitor and measure** everything

## Project Setup Checklist

### **Phase 1: Foundation (Week 1)**

**Monorepo Setup:**
- [ ] Initialize pnpm workspace with `pnpm-workspace.yaml`
- [ ] Create apps directory structure (user, admin, api)
- [ ] Create packages directory structure (shared-types, ui-components, utils)
- [ ] Set up root `package.json` with workspace scripts
- [ ] Configure TypeScript for all packages

**Development Environment:**
- [ ] Set up Docker Compose for local development
- [ ] Configure PostgreSQL database container
- [ ] Set up Redis for caching
- [ ] Create development environment variables
- [ ] Configure hot reloading for all services

**Code Quality Setup:**
- [ ] Configure ESLint with TypeScript rules
- [ ] Set up Prettier for code formatting
- [ ] Add Husky for pre-commit hooks
- [ ] Configure lint-staged for staged files
- [ ] Set up commit message conventions

### **Phase 2: Core Services (Week 2)**

**Backend Setup:**
- [ ] Initialize Fastify application
- [ ] Set up Prisma with PostgreSQL
- [ ] Create basic API structure (controllers, services, routes)
- [ ] Implement authentication middleware
- [ ] Add request validation with JSON Schema
- [ ] Set up error handling and logging

**Frontend Setup:**
- [ ] Initialize React + Vite application
- [ ] Set up React Router for navigation
- [ ] Configure TanStack Query for server state
- [ ] Set up Zustand for client state
- [ ] Add Tailwind CSS for styling
- [ ] Create basic component structure

**Database Setup:**
- [ ] Design initial database schema
- [ ] Create Prisma schema file
- [ ] Set up database migrations
- [ ] Add seed data for development
- [ ] Configure connection pooling
- [ ] Set up database backup strategy

### **Phase 3: Features & Testing (Week 3)**

**Core Features:**
- [ ] Implement user authentication (JWT)
- [ ] Create basic CRUD operations
- [ ] Add file upload functionality
- [ ] Implement search and filtering
- [ ] Add pagination for large datasets
- [ ] Set up caching strategy with Redis

**Testing Setup:**
- [ ] Configure Jest for unit testing
- [ ] Set up React Testing Library for components
- [ ] Add Playwright for E2E testing
- [ ] Create test database configuration
- [ ] Set up test coverage reporting
- [ ] Add performance testing setup

### **Phase 4: Production Ready (Week 4)**

**CI/CD Pipeline:**
- [ ] Set up GitHub Actions workflows
- [ ] Configure automated testing
- [ ] Add security scanning
- [ ] Set up deployment automation
- [ ] Configure environment-specific builds
- [ ] Add performance monitoring

**Production Deployment:**
- [ ] Set up production environment
- [ ] Configure SSL certificates
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategies
- [ ] Add health checks
- [ ] Set up logging aggregation

### **Phase 5: Nginx & Static File Optimization (Week 5-6)**

**Development Environment Setup:**
- [ ] Create development nginx configuration
- [ ] Update frontend Dockerfile for hot reloading
- [ ] Set up Vite dev server with nginx proxy
- [ ] Test development workflow with hot reloading
- [ ] Configure source maps for debugging

**Production Environment Setup:**
- [ ] Create production nginx configuration
- [ ] Update frontend Dockerfile for static serving
- [ ] Implement static file caching headers
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Configure gzip compression
- [ ] Set up rate limiting for API endpoints

**Performance Optimization:**
- [ ] Optimize database queries
- [ ] Implement Redis caching strategies
- [ ] Optimize frontend bundle size
- [ ] Add image optimization
- [ ] Configure CDN for static assets
- [ ] Set up performance monitoring

**Security Hardening:**
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Configure CORS properly
- [ ] Set up security headers
- [ ] Add audit logging
- [ ] Configure backup encryption

Remember that the best architecture is the one that serves your specific needs and can evolve with your project requirements.

### 16. Reverse Proxy & Static File Serving

#### **Technology Selection**

**Nginx (Recommended for Production)**
- **Battle-tested** - Proven in high-traffic production environments
- **Excellent performance** - Highly optimized for static file serving
- **Rich ecosystem** - Extensive modules and community support
- **Mature caching** - Advanced caching strategies and CDN integration
- **Load balancing** - Built-in load balancing capabilities
- **Security features** - Rate limiting, DDoS protection, SSL termination
- **Wide adoption** - Every DevOps engineer knows nginx
- **Great documentation** - Extensive official and community docs
- **Flexible configuration** - Fine-grained control over every aspect
- **Monitoring integration** - Works with all monitoring tools
- **Docker integration** - Excellent container support

**Caddy (Alternative for Simplicity)**
- **Automatic HTTPS** - Built-in Let's Encrypt integration
- **Simpler configuration** - Less boilerplate than nginx
- **Modern defaults** - Security headers and optimizations out of the box
- **Good performance** - Competitive with nginx for most use cases
- **Easier setup** - Less configuration required
- **Automatic SSL** - No manual certificate management
- **Modern syntax** - Cleaner configuration format
- **Built-in security** - Security headers by default

#### **Common Setup Issues to Avoid**

**Development vs Production Mismatch:**
- Using development servers in production (inefficient)
- No hot reloading in development environment
- Static files served through proxy instead of direct nginx serving

**Performance Issues:**
- Double proxying: nginx → dev server → static files
- No static file caching headers
- Missing compression for static assets
- No CDN integration

**Development Experience:**
- No hot reloading for frontend development
- Complex setup for local development
- No source maps in production
- **WebSocket connection issues** - Vite requires proper WebSocket handling for hot reload

**Security Concerns:**
- Missing security headers for static files
- No CSP (Content Security Policy) headers
- Missing HSTS headers

#### **Configuration Requirements**

**Production Environment:**
- Direct static file serving (avoid double proxying)
- Static file caching with appropriate headers
- Gzip compression for text-based assets
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting for API endpoints
- Health check endpoints
- Proper upstream definitions with keepalive connections

**Development Environment:**
- WebSocket support for Vite hot reload
- Extended timeouts for WebSocket connections (86400s)
- Proper proxy headers for WebSocket upgrade
- Vite dev server endpoint handling (`/@vite/client`)
- Source maps for debugging
- Hot reload functionality preservation

**⚠️ Important: WebSocket Handling for Vite**

When setting up nginx for development with Vite, proper WebSocket handling is crucial for hot reload functionality. Vite uses WebSockets for real-time communication between the dev server and browser.

#### **Performance Optimization**

**Static File Caching:**
- Cache static assets (JS, CSS, images, fonts) for 1 year
- Cache HTML files for 1 hour with revalidation
- Use immutable cache headers for versioned assets
- Implement Vary headers for compression

**Compression Settings:**
- Enable gzip compression for text-based assets
- Configure appropriate compression levels (6-9)
- Include all text formats (CSS, JS, JSON, XML, SVG)
- Add font compression for web fonts

**Security Headers:**
- Implement comprehensive security headers
- Add CSP (Content Security Policy) headers
- Include HSTS for HTTPS enforcement
- Set X-Frame-Options and X-Content-Type-Options

#### **Monitoring and Logging**

**Nginx Logging Configuration:**
- Implement structured JSON logging for better parsing
- Include request time, status codes, and user agents
- Configure appropriate log levels for development and production
- Set up log rotation and retention policies

**Health Check Endpoints:**
- Create dedicated health check endpoints for nginx
- Implement backend health check proxying
- Add monitoring for WebSocket connections in development
- Set up automated health monitoring

#### **Docker Configuration**

**Production Requirements:**
- Multi-stage builds for optimized images
- Static file serving through nginx
- Environment-specific configurations
- Proper volume management for configurations

**Development Requirements:**
- Hot reloading with Vite dev server
- Source code mounting for live updates
- WebSocket support for development
- Environment variables for development mode

#### **Implementation Guidelines**

**Development Environment Setup:**
- Configure nginx for WebSocket support with Vite
- Set up hot reloading with proper timeouts
- Implement source maps for debugging
- Test file change detection and live updates

**Production Environment Setup:**
- Configure direct static file serving
- Implement comprehensive caching strategies
- Add security headers and compression
- Set up monitoring and health checks

#### **Troubleshooting**

**WebSocket Issues (Development):**
If hot reload isn't working in development:
1. **Check WebSocket connections** - Verify `/@vite/client` endpoint is accessible
2. **Increase timeouts** - WebSocket connections need longer timeouts (86400s)
3. **Check proxy headers** - Ensure `Upgrade` and `Connection` headers are set
4. **Verify Vite dev server** - Ensure Vite is running on the correct port
5. **Check browser console** - Look for WebSocket connection errors
6. **Test direct access** - Try accessing Vite dev server directly (bypass nginx)

This comprehensive nginx configuration provides a robust foundation for both development and production environments, avoiding common pitfalls and ensuring optimal performance.
