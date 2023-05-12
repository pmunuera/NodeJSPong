-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: containers-us-west-80.railway.app    Database: railway
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Partida`
--

DROP TABLE IF EXISTS `Partida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Partida` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `time` timestamp NULL DEFAULT NULL,
  `duracio` time DEFAULT NULL,
  `idJugador0` int DEFAULT NULL,
  `idJugador1` int DEFAULT NULL,
  `tocsJugador0` int DEFAULT NULL,
  `tocsJugador1` int DEFAULT NULL,
  `guanyador` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `idJugador0` (`idJugador0`),
  KEY `idJugador1` (`idJugador1`),
  KEY `guanyador` (`guanyador`),
  CONSTRAINT `Partida_ibfk_1` FOREIGN KEY (`idJugador0`) REFERENCES `Usuari` (`id`),
  CONSTRAINT `Partida_ibfk_2` FOREIGN KEY (`idJugador1`) REFERENCES `Usuari` (`id`),
  CONSTRAINT `Partida_ibfk_3` FOREIGN KEY (`guanyador`) REFERENCES `Usuari` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3796 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Partida`
--

LOCK TABLES `Partida` WRITE;
/*!40000 ALTER TABLE `Partida` DISABLE KEYS */;
INSERT INTO `Partida` VALUES (2,'2013-11-24 18:15:10','00:03:10',43,44,6,5,43),(3,'2013-11-24 20:15:10','00:05:25',43,44,8,4,44),(3790,'2023-05-12 11:56:22','00:00:38',43,44,0,0,43),(3791,'2023-05-12 12:03:34','00:00:50',43,44,1,0,43),(3792,'2023-05-12 12:04:17','00:00:38',43,44,0,0,43),(3793,'2023-05-12 12:05:00','00:00:37',43,44,0,0,43),(3794,'2023-05-12 12:32:48','00:00:38',43,44,0,0,43),(3795,'2023-05-12 12:34:07','00:00:57',43,44,0,1,44);
/*!40000 ALTER TABLE `Partida` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Usuari`
--

DROP TABLE IF EXISTS `Usuari`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuari` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pseudonim` varchar(200) DEFAULT NULL,
  `codi` text,
  `color` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `pseudonim` (`pseudonim`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Usuari`
--

LOCK TABLES `Usuari` WRITE;
/*!40000 ALTER TABLE `Usuari` DISABLE KEYS */;
INSERT INTO `Usuari` VALUES (33,'ll','l','green'),(34,'m','m','green'),(35,'t','t','green'),(37,'tttt','t','green'),(38,'po','1','navy'),(40,'fg','1','navy'),(42,'hola','1234','green'),(43,'pablo','1234','blue'),(44,'alejandro','1234','green');
/*!40000 ALTER TABLE `Usuari` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-05-12 12:39:19
