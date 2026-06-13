#!/bin/bash
#SBATCH -J Si        # Job Name
#SBATCH -o Si.o%j    # Name of the error and output files (%j appends the jobID)
#SBATCH -N 1             # Requests nodes
#SBATCH -n 20            # Requests number of tasks, in multiples of 64
#SBATCH -p normal   # Queue name: development (max 2 hr walltime) or normal
#SBATCH -t 00:30:00      # Run time (hh:mm:ss)
#SBATCH -A TG-MPS150006

module load intel/19.1.1
module load impi/19.0.7
module load mvapich2/2.3.6
module load qe/7.0

eta_list="0.497 0.498 0.499 0.500 0.501 0.502 0.503"
for eta in $eta_list
do
cat > Si_isotro.cell_$eta.in << EOF
&CONTROL
 calculation = 'relax',
 restart_mode = 'from_scratch',
 prefix='Si_elastic_isotropic',
 pseudo_dir='./',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=0,
 celldm(1)=10.1941d0,
 nat=2,
 ntyp=1,
 ecutwfc=30,
 occupations = 'fixed',
 use_all_frac = .true.,
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
Si 28.0855d0 Si_LDA.UPF

ATOMIC_POSITIONS crystal
Si 0.d0 0.d0 0.d0
Si 0.25d0 0.25d0 0.25d0

K_POINTS automatic
  9 9 9 0 0 0

CELL_PARAMETERS alat 
-$eta 0.d0 $eta
0.d0 $eta $eta
-$eta $eta 0.d0
EOF

pw.x < Si_isotro.cell_$eta.in > Si_isotro.cell_$eta.out # Run the executable named pw.x 

done
