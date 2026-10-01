# Imagen del backend para desplegarlo (Render). Dos etapas:
# 1) compilar con el JDK completo y Maven, 2) ejecutar solo con el JRE y el .jar.
# Así la imagen final es más pequeña y no lleva ni el código fuente ni Maven.

# ---------- Etapa 1: compilar ----------
FROM eclipse-temurin:17-jdk AS compilacion
WORKDIR /app

# Primero solo lo necesario para descargar las dependencias: si el código cambia
# pero el pom.xml no, Docker reutiliza esta capa y no las vuelve a descargar.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/ src/
# Los tests se pasan en GitHub Actions; aquí solo se empaqueta
RUN ./mvnw -B -q -DskipTests package

# ---------- Etapa 2: ejecutar ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# No ejecutar como root dentro del contenedor
RUN useradd --system --uid 1001 app
COPY --from=compilacion /app/target/*.jar app.jar
USER app

# El plan gratuito de Render tiene 512 MB: la JVM usa como mucho el 75 % de la memoria
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
