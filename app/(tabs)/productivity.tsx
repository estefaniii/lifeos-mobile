import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { BarChart, PieChart } from '@/components/charts';
import { AddProductivityModal } from '@/components/modals/add-productivity-modal';
import { AddProjectModal } from '@/components/modals/add-project-modal';
import { useColors } from '@/hooks/use-colors';
import { useProductivityByProject, useTodayProductivity, useProjects, useDeleteProject } from '@/hooks/use-productivity';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

/**
 * Productivity Screen
 * 
 * Displays productivity data with:
 * - Bar chart: Hours per project (weekly)
 * - Pie chart: Time distribution (today)
 * - Project cards
 * - Today's productivity summary
 */
export default function ProductivityScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Fetch data
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: productivityByProject, isLoading: projectsStatsLoading } = useProductivityByProject(7);
  const { data: todayProductivity, isLoading: todayLoading } = useTodayProductivity();
  const deleteProject = useDeleteProject();

  // Prepare chart data
  const barChartData = (productivityByProject || []).map((item) => ({
    x: item.name.substring(0, 10),
    y: parseFloat(item.hours),
  }));

  const pieChartData = (todayProductivity?.byProject || []).map((item) => ({
    x: item.name,
    y: item.minutes,
  }));

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
    } finally {
      setIsRefreshing(false);
    }
  };

  void (projectsLoading || projectsStatsLoading || todayLoading);

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Productividad</Text>
          <Text className="text-sm text-muted mt-1" style={{ color: '#A1A1AA' }}>Monitorea tu tiempo y proyectos</Text>
        </View>

        {/* Today's Summary */}
        <View className="mx-6 mb-6 bg-primary rounded-2xl p-6">
          <Text className="text-xs font-semibold text-background opacity-75 mb-2">
            PRODUCTIVIDAD HOY
          </Text>
          <Text className="text-4xl font-bold text-background mb-2">
            {todayProductivity?.totalHours || 0}h
          </Text>
          <Text className="text-sm text-background opacity-90">
            {todayProductivity?.totalMinutes || 0} minutos dedicados
          </Text>
        </View>

        {/* Bar Chart: Hours per Project (Weekly) */}
        {barChartData.length > 0 && (
          <View className="px-6">
            <BarChart
              data={barChartData}
              title="Horas por Proyecto (Últimos 7 Días)"
              yLabel="Horas"
              color={colors.primary}
            />
          </View>
        )}

        {/* Pie Chart: Time Distribution (Today) */}
        {pieChartData.length > 0 && (
          <View className="px-6">
            <PieChart
              data={pieChartData}
              title="Distribución de Tiempo (Hoy)"
              colors={[colors.primary, colors.success, colors.warning, colors.error]}
            />
          </View>
        )}

        {/* Projects List */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Tus Proyectos</Text>
            <Pressable onPress={() => setShowProjectModal(true)}>
              <Text className="text-sm font-semibold text-primary">+ Nuevo</Text>
            </Pressable>
          </View>

          {projects && projects.length > 0 ? (
            projects.map((project) => {
              const projectStats = productivityByProject?.find((p) => p.name === project.name);
              return (
                <View
                  key={project.id}
                  className="bg-surface rounded-lg p-4 mb-3 flex-row justify-between items-center"
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground" style={{ color: '#FAFAFA' }}>{project.name}</Text>
                  </View>
                  <View className="items-end flex-row gap-4">
                    <View className="items-end">
                      <Text className="text-lg font-bold text-primary">
                        {projectStats?.hours || '0'}h
                      </Text>
                      <Text className="text-xs text-muted mt-1" style={{ color: '#A1A1AA' }}>esta semana</Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Eliminar proyecto', `¿Eliminar "${project.name}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: () => deleteProject.mutate(project.id),
                          },
                        ])
                      }
                    >
                      <Text className="text-muted text-lg" style={{ color: '#A1A1AA' }}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <Pressable
              onPress={() => setShowProjectModal(true)}
              className="bg-surface border border-dashed border-border rounded-lg p-6 items-center"
            >
              <Text className="text-muted mb-2" style={{ color: '#A1A1AA' }}>No hay proyectos creados</Text>
              <Text className="text-primary text-sm font-semibold">+ Crear primer proyecto</Text>
            </Pressable>
          )}
        </View>

        {/* Call to Action */}
        <View className="px-6 mb-8">
          <Pressable onPress={() => setShowAddModal(true)} className="bg-primary rounded-lg p-4 items-center">
            <Text className="text-background font-semibold">Registrar Tiempo de Trabajo</Text>
          </Pressable>
        </View>

        {user && projects && (
          <AddProductivityModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            userId={String(user.id)}
            projects={projects}
          />
        )}
        {user && (
          <AddProjectModal
            visible={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            userId={String(user.id)}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
